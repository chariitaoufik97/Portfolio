"use strict";

/* ==========================================
   01. AVVIO DEL PORTFOLIO
========================================== */

// Lo script è caricato con defer; il DOM è pronto.
document.addEventListener("DOMContentLoaded", () => {

  /* ==========================================
     02. ANNO AUTOMATICO DEL FOOTER
  ========================================== */

  const currentYear = document.querySelector("#current-year");
  if (currentYear) {
    currentYear.textContent = String(new Date().getFullYear());
  }


  /* ==========================================
     03. COPIA EMAIL
  ========================================== */

  const emailLink = document.querySelector("#contact .contact-email");
  const copyButton = document.querySelector("#copy-email");
  const copyFeedback = document.querySelector("#copy-feedback");

  if (emailLink && copyButton && copyFeedback) {
    copyButton.addEventListener("click", async () => {
      // Recupera l'indirizzo dall'href mailto, senza duplicarlo.
      const email = emailLink.getAttribute("href")
        ?.replace(/^mailto:/i, "")
        .split("?")[0];

      if (!email) return;

      try {
        // Clipboard API disponibile su localhost e connessioni sicure.
        if (!navigator.clipboard?.writeText) {
          throw new Error("Clipboard API non disponibile");
        }

        await navigator.clipboard.writeText(email);
        copyButton.textContent = "Copiata!";
        copyFeedback.textContent = "Indirizzo email copiato negli appunti.";
      } catch {
        copyButton.textContent = "Copia email";
        copyFeedback.textContent =
          "Copia non disponibile: seleziona l'indirizzo e copialo manualmente.";
      }
    });
  }


  /* ==========================================
     04. TERMINALE - DIGITAZIONE E COLORI DEL CODICE
  ========================================== */

  const codeElement = document.querySelector("#typed-code");
  const terminal = document.querySelector(".terminal");
  if (!codeElement || !terminal) return;

  // Il testo originale resta nel file HTML come fallback senza JavaScript.
  const sourceCode = codeElement.textContent;

  /*
     Divide il testo in token: commenti, stringhe, keyword,
     proprietà e metodi. La regexp lavora sul testo originale,
     MAI su HTML già colorato (evita span annidati o corrotti).
  */
  function tokenize(code) {
    const expression = /\/\/[^\n]*|"(?:\\.|[^"\\])*"|\b(?:const|let|var|return|function|if|else)\b|\b(?:name|focus|mindset)\b(?=\s*:)|\bbuild\b(?=\s*\()/g;
    const tokens = [];
    let start = 0;

    for (const match of code.matchAll(expression)) {
      const index = match.index;
      if (index > start) {
        tokens.push({ text: code.slice(start, index), type: null });
      }

      const text = match[0];
      let type;
      if (text.startsWith("//")) type = "comment";
      else if (text.startsWith('"')) type = "string";
      else if (/^(?:const|let|var|return|function|if|else)$/.test(text)) type = "keyword";
      else if (text === "build") type = "function";
      else type = "property";

      tokens.push({ text, type });
      start = index + text.length;
    }

    if (start < code.length) {
      tokens.push({ text: code.slice(start), type: null });
    }
    return tokens;
  }

  const tokens = tokenize(sourceCode);

  // Costruisce veri nodi di testo e span, senza usare innerHTML.
  function appendToken(token, substring) {
    if (!substring) return null;
    const node = document.createTextNode(substring);
    if (token.type) {
      const span = document.createElement("span");
      span.className = `token-${token.type}`;
      span.appendChild(node);
      codeElement.appendChild(span);
    } else {
      codeElement.appendChild(node);
    }
    return node;
  }

  // Se l'utente preferisce meno movimento, mostra subito tutto il codice.
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  function showFullCode() {
    codeElement.classList.remove("is-typing");
    codeElement.replaceChildren();
    for (const token of tokens) appendToken(token, token.text);
  }

  if (reducedMotion.matches) {
    showFullCode();
    return;
  }

  // Animazione avviata una sola volta, quando il terminale è visibile.
  let started = false;
  function startTyping() {
    if (started) return;
    started = true;
    codeElement.replaceChildren();
    codeElement.classList.add("is-typing");

    let tokenIndex = 0;
    let charIndex = 0;
    let activeTextNode = null;

    function typeNextCharacter() {
      // Se la preferenza cambia durante la digitazione, termina subito.
      if (reducedMotion.matches) {
        showFullCode();
        return;
      }

      if (tokenIndex >= tokens.length) {
        codeElement.classList.remove("is-typing");
        return;
      }

      const token = tokens[tokenIndex];
      if (charIndex === 0) {
        // Crea lo span o il nodo una volta per ogni token.
        activeTextNode = document.createTextNode("");
        if (token.type) {
          const span = document.createElement("span");
          span.className = `token-${token.type}`;
          span.appendChild(activeTextNode);
          codeElement.appendChild(span);
        } else {
          codeElement.appendChild(activeTextNode);
        }
      }

      const character = token.text[charIndex];
      activeTextNode.appendData(character);
      charIndex++;

      if (charIndex >= token.text.length) {
        tokenIndex++;
        charIndex = 0;
      }

      // Varia la velocità dopo gli a capo e la punteggiatura.
      const delay = character === "\n" ? 130 : /[{};\[\]]/.test(character) ? 65 : 26;
      window.setTimeout(typeNextCharacter, delay);
    }

    typeNextCharacter();
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      observer.disconnect();
      startTyping();
    }, { threshold: 0.2 });
    observer.observe(terminal);
  } else {
    startTyping();
  }
});
