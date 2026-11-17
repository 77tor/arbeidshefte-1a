(function () {
  const TOTAL_SHEETS = 14;
  const AUTH_KEY = "haanes_1kl_logged_in";
  const STATE_KEY = "haanes_1kl_arbeidshefte_v3";

  let activeSheet = 1;
  let showPageNumbers = true;

  // Hent liste over ukens bokstaver (støtter både bokstaver: ["I","S"] og bokstav: "S")
  function getLetters(norsk) {
    if (!norsk) return [];
    if (Array.isArray(norsk.bokstaver)) return norsk.bokstaver.map((b) => b.toUpperCase());
    if (norsk.bokstav) return [norsk.bokstav.toUpperCase()];
    return [];
  }

// Beregn standard ukenummer (starter på Uke 37 og hopper over Uke 40 / høstferie)
  function getDefaultWeekLabel(sheetIndex) {
    let week = 36 + sheetIndex;
    if (week >= 40) week += 1;
    return `Uke ${week}`;
  }

function createDefaultSettings() {
    const map = {};
    for (let i = 0; i <= TOTAL_SHEETS; i++) {
      if (i === 0) {
        map[0] = {
          visible: true,
          showToc: true
        };
        continue;
      }
      map[i] = {
        visible: true,
        weekLabel: getDefaultWeekLabel(i),
        norsk: {
          show: true,
          intro: true,
          match: true,
          words: true,
          onlyFirstWord: true,
          rhyme: true
        },
        matte: {
          show: true,
          intro: true,
          dice: true,
          neighbors: true,
          quantity: true,
          count: true
        }
      };
    }
    return map;
  }

  let sheetSettings = loadSettings();

function loadSettings() {
    try {
      const saved = localStorage.getItem(STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const defaults = createDefaultSettings();
        if (parsed[0]) {
          defaults[0] = { ...defaults[0], ...parsed[0] };
        }
        for (let i = 1; i <= TOTAL_SHEETS; i++) {
          if (parsed[i]) {
            defaults[i] = {
              ...defaults[i],
              ...parsed[i],
              norsk: { ...defaults[i].norsk, ...(parsed[i].norsk || {}) },
              matte: { ...defaults[i].matte, ...(parsed[i].matte || {}) }
            };
          }
        }
        return defaults;
      }
    } catch (e) {
      console.warn("Kunne ikke lese lagrede innstillinger:", e);
    }
    return createDefaultSettings();
  }

  function saveSettings() {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(sheetSettings));
    } catch (e) {
      console.warn("Kunne ikke lagre innstillinger:", e);
    }
  }

  const ICON_DOC = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
  const ICON_EYE_OPEN = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  const ICON_EYE_OFF = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

  // ==========================================
  // INNLOGGING OG VANNMERKE FOR HÅNES SKOLE
  // ==========================================
  const HAANES_AUTH = {
    user: "Haanes",
    pass: "Hest1234",
    storageKey: "haanes_arbeidshefte_auth"
  };

  function updateAuthButtons(isLoggedIn) {
    const loginBtn = document.getElementById("sidebarLoginBtn");
    const logoutBtn = document.getElementById("sidebarLogoutBtn");

    if (isLoggedIn) {
      if (loginBtn) loginBtn.classList.add("hidden");
      if (logoutBtn) logoutBtn.classList.remove("hidden");
    } else {
      if (loginBtn) loginBtn.classList.remove("hidden");
      if (logoutBtn) logoutBtn.classList.add("hidden");
    }
  }

  function openLoginModal() {
    const modal = document.getElementById("loginModal");
    const errorMsg = document.getElementById("loginErrorMsg");
    if (errorMsg) errorMsg.classList.add("hidden");
    if (modal) modal.classList.remove("hidden");
  }

  function handleLoginSubmit(event) {
    event.preventDefault();
    const usernameInput = document.getElementById("loginUsername").value.trim();
    const passwordInput = document.getElementById("loginPassword").value;
    const errorMsg = document.getElementById("loginErrorMsg");

    if (usernameInput.toLowerCase() === HAANES_AUTH.user.toLowerCase() && passwordInput === HAANES_AUTH.pass) {
      sessionStorage.setItem(HAANES_AUTH.storageKey, "logged_in");
      document.body.classList.remove("show-watermark");
      document.getElementById("loginModal").classList.add("hidden");
      if (errorMsg) errorMsg.classList.add("hidden");
      updateAuthButtons(true);
    } else {
      if (errorMsg) errorMsg.classList.remove("hidden");
    }
  }

  function continueWithWatermark() {
    sessionStorage.setItem(HAANES_AUTH.storageKey, "guest");
    document.body.classList.add("show-watermark");
    document.getElementById("loginModal").classList.add("hidden");
    updateAuthButtons(false);
  }

  function logoutUser() {
    sessionStorage.removeItem(HAANES_AUTH.storageKey);
    document.body.classList.add("show-watermark");
    updateAuthButtons(false);
    openLoginModal();
  }

  function initAuthWatermark() {
    const savedState = sessionStorage.getItem(HAANES_AUTH.storageKey);
    const modal = document.getElementById("loginModal");

    if (savedState === "logged_in") {
      document.body.classList.remove("show-watermark");
      if (modal) modal.classList.add("hidden");
      updateAuthButtons(true);
    } else if (savedState === "guest") {
      document.body.classList.add("show-watermark");
      if (modal) modal.classList.add("hidden");
      updateAuthButtons(false);
    } else {
      document.body.classList.add("show-watermark");
      if (modal) modal.classList.remove("hidden");
      updateAuthButtons(false);
    }

    const form = document.getElementById("haanesLoginForm");
    if (form) form.addEventListener("submit", handleLoginSubmit);

    const guestBtn = document.getElementById("btnContinueWatermark");
    if (guestBtn) guestBtn.addEventListener("click", continueWithWatermark);

    const loginBtn = document.getElementById("sidebarLoginBtn");
    if (loginBtn) loginBtn.addEventListener("click", openLoginModal);

    const logoutBtn = document.getElementById("sidebarLogoutBtn");
    if (logoutBtn) logoutBtn.addEventListener("click", logoutUser);
  }

  // REDIGER UKENUMRE-MODAL
  document.getElementById("btn-edit-weeks").addEventListener("click", () => {
    const grid = document.getElementById("weeks-editor-grid");
    grid.innerHTML = "";
    for (let i = 1; i <= TOTAL_SHEETS; i++) {
      const norsk = window.NORSK_DATA[i] || {};
      const letterLabel = getLetters(norsk).join("").toLowerCase();
      const letter = letterLabel ? ` (${letterLabel})` : "";
      const row = document.createElement("div");
      row.className = "week-edit-item";
      row.innerHTML = `
        <span>Ark ${i}${letter}</span>
        <input type="text" data-sheet="${i}" value="${sheetSettings[i].weekLabel}" />
      `;
      row.querySelector("input").addEventListener("input", (e) => {
        sheetSettings[i].weekLabel = e.target.value;
        saveSettings();
        renderSidebarCards();
        renderSheets();
      });
      grid.appendChild(row);
    }
    document.getElementById("weeks-modal").classList.remove("hidden");
  });

document.getElementById("btn-reset-weeks").addEventListener("click", () => {
    for (let i = 1; i <= TOTAL_SHEETS; i++) {
      sheetSettings[i].weekLabel = getDefaultWeekLabel(i);
    }
    saveSettings();
    document.getElementById("btn-edit-weeks").click();
    renderSidebarCards();
    renderSheets();
  });

  document.getElementById("btn-close-weeks").addEventListener("click", () => {
    document.getElementById("weeks-modal").classList.add("hidden");
  });

  document.getElementById("chk-show-pagenums").addEventListener("change", (e) => {
    showPageNumbers = e.target.checked;
    renderSheets();
  });

setupPrintModals();

  // RENDER KORTENE I VENSTREMENYEN (1–14)
  function renderSidebarCards() {
    const container = document.getElementById("sheet-cards-list");
    container.innerHTML = "";

// KORT FOR ARK 0 (FORSIDE & INNHOLDSFORTEGNELSE)
    const cfg0 = sheetSettings[0];
    const isCoverSelected = activeSheet === 0;
    const coverCard = document.createElement("div");
    coverCard.className =
      "sheet-card" +
      (isCoverSelected ? " active" : "") +
      (!cfg0.visible ? " is-hidden-sheet" : "");

    coverCard.innerHTML = `
      <div class="card-top-row" style="margin-bottom: ${isCoverSelected && cfg0.visible ? "8px" : "0"};">
        <div class="card-title-left">
          ${ICON_DOC}
          <span>Ark 0 – Forside</span>
        </div>
        <div class="card-meta-right">
          <span class="week-badge">Hefte</span>
          <button type="button" class="eye-btn" data-action="toggle-visible" title="${cfg0.visible ? "Skjul forside fra utskrift" : "Vis forside"}">
            ${cfg0.visible ? ICON_EYE_OPEN : ICON_EYE_OFF}
          </button>
        </div>
      </div>

      ${isCoverSelected && cfg0.visible ? `
        <div class="card-subtasks-row">
          <button type="button" class="mini-chip ${cfg0.showToc ? "on" : ""}" data-action="toggle-toc">Innholdsfortegnelse</button>
        </div>
      ` : ""}
    `;

    coverCard.addEventListener("click", (e) => {
      if (e.target.closest("button")) return;
      activeSheet = 0;
      renderSidebarCards();
      const target = document.getElementById("sheet-page-cover") || document.getElementById("sheet-page-toc");
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    coverCard.querySelector('[data-action="toggle-visible"]').addEventListener("click", (e) => {
      e.stopPropagation();
      cfg0.visible = !cfg0.visible;
      saveSettings();
      renderSidebarCards();
      renderSheets();
    });

    const tocBtn = coverCard.querySelector('[data-action="toggle-toc"]');
    if (tocBtn) {
      tocBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        cfg0.showToc = !cfg0.showToc;
        saveSettings();
        renderSidebarCards();
        renderSheets();
      });
    }

    container.appendChild(coverCard);

    for (let i = 1; i <= TOTAL_SHEETS; i++) {
      const cfg = sheetSettings[i];
      const norsk = window.NORSK_DATA[i] || {};
      const matte = window.MATTE_DATA[i] || {};
      const letterLabel = getLetters(norsk).join("").toLowerCase();
      const isSelected = i === activeSheet;

      let mode = "begge";
      if (cfg.norsk.show && !cfg.matte.show) mode = "norsk";
      else if (!cfg.norsk.show && cfg.matte.show) mode = "matte";

      const card = document.createElement("div");
      card.className =
        "sheet-card" +
        (isSelected ? " active" : "") +
        (!cfg.visible ? " is-hidden-sheet" : "");

      let subtaskChips = "";
      if (isSelected) {
        if (cfg.norsk.show) {
          subtaskChips += `
            <button type="button" class="mini-chip ${cfg.norsk.intro ? "on" : ""}" data-sub="norsk.intro">Bokstavhus</button>
            <button type="button" class="mini-chip ${cfg.norsk.match ? "on" : ""}" data-sub="norsk.match">Sett strek</button>
            <button type="button" class="mini-chip ${cfg.norsk.words ? "on" : ""}" data-sub="norsk.words">Skrive ord</button>
            <button type="button" class="mini-chip ${cfg.norsk.onlyFirstWord ? "on" : ""}" data-sub="norsk.onlyFirstWord">Kun 1. ord</button>
            <button type="button" class="mini-chip ${cfg.norsk.rhyme ? "on" : ""}" data-sub="norsk.rhyme">Rimeord</button>
          `;
        }
        if (cfg.matte.show) {
          subtaskChips += `
          <button type="button" class="mini-chip ${cfg.matte.intro ? "on" : ""}" data-sub="matte.intro">Tall ${matte.tall ?? i}</button>
          <button type="button" class="mini-chip ${cfg.matte.dice ? "on" : ""}" data-sub="matte.dice">Terning</button>
          <button type="button" class="mini-chip ${cfg.matte.neighbors ? "on" : ""}" data-sub="matte.neighbors">Nabotall</button>
          <button type="button" class="mini-chip ${cfg.matte.quantity ? "on" : ""}" data-sub="matte.quantity">Mengde</button>
          <button type="button" class="mini-chip ${cfg.matte.count ? "on" : ""}" data-sub="matte.count">Tell og skriv</button>
          `;
        }
      }

      card.innerHTML = `
        <div class="card-top-row">
          <div class="card-title-left">
            ${ICON_DOC}
            <span>Arbeidsark ${i}${letterLabel ? ` – ${letterLabel}` : ""}</span>
          </div>
          <div class="card-meta-right">
            <span class="week-badge">${cfg.weekLabel}</span>
            <button type="button" class="eye-btn" data-action="toggle-visible" title="${cfg.visible ? "Skjul ark fra utskrift" : "Vis ark"}">
              ${cfg.visible ? ICON_EYE_OPEN : ICON_EYE_OFF}
            </button>
          </div>
        </div>

        <div class="card-controls-row">
          <div class="pill-group" style="width:100%;">
            <button type="button" style="flex:1;" class="pill-btn ${mode === "norsk" ? "active" : ""}" data-mode="norsk">Bare norsk</button>
            <button type="button" style="flex:1;" class="pill-btn ${mode === "matte" ? "active" : ""}" data-mode="matte">Bare matte</button>
            <button type="button" style="flex:1;" class="pill-btn ${mode === "begge" ? "active" : ""}" data-mode="begge">Begge</button>
          </div>
        </div>

        ${isSelected && subtaskChips ? `<div class="card-subtasks-row">${subtaskChips}</div>` : ""}
      `;

      card.addEventListener("click", (e) => {
        if (e.target.closest("button")) return;
        activeSheet = i;
        renderSidebarCards();
        const targetSheet =
          document.getElementById(`sheet-page-${i}-norsk`) ||
          document.getElementById(`sheet-page-${i}-matte`);
        if (targetSheet) {
          targetSheet.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });

      card.querySelector('[data-action="toggle-visible"]').addEventListener("click", (e) => {
        e.stopPropagation();
        cfg.visible = !cfg.visible;
        saveSettings();
        renderSidebarCards();
        renderSheets();
      });

      card.querySelectorAll("[data-mode]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          activeSheet = i;
          const selectedMode = btn.getAttribute("data-mode");
          cfg.visible = true;

          if (selectedMode === "norsk") {
            cfg.norsk.show = true;
            cfg.matte.show = false;
            if (!cfg.norsk.intro && !cfg.norsk.match && !cfg.norsk.words && !cfg.norsk.rhyme) {
              cfg.norsk.intro = cfg.norsk.match = cfg.norsk.words = true;
            }
          } else if (selectedMode === "matte") {
            cfg.norsk.show = false;
            cfg.matte.show = true;
            if (!cfg.matte.intro && !cfg.matte.neighbors && !cfg.matte.quantity) {
              cfg.matte.intro = cfg.matte.neighbors = cfg.matte.quantity = true;
            }
          } else {
            cfg.norsk.show = true;
            cfg.matte.show = true;
            if (!cfg.norsk.intro && !cfg.norsk.match && !cfg.norsk.words && !cfg.norsk.rhyme) {
              cfg.norsk.intro = cfg.norsk.match = cfg.norsk.words = true;
            }
            if (!cfg.matte.intro && !cfg.matte.neighbors && !cfg.matte.quantity) {
              cfg.matte.intro = cfg.matte.neighbors = cfg.matte.quantity = true;
            }
          }

          saveSettings();
          renderSidebarCards();
          renderSheets();
        });
      });

      card.querySelectorAll("[data-sub]").forEach((chip) => {
        chip.addEventListener("click", (e) => {
          e.stopPropagation();
          const subPath = chip.getAttribute("data-sub");
          const [subj, key] = subPath.split(".");
          cfg[subj][key] = !cfg[subj][key];

          // Slår automatisk på/av Rimeord når man veksler mellom 3 ord og Kun 1. ord
          if (subPath === "norsk.onlyFirstWord") {
            cfg.norsk.rhyme = cfg.norsk.onlyFirstWord;
            if (cfg.norsk.onlyFirstWord) cfg.norsk.words = true;
          }

          const anyNorsk = cfg.norsk.intro || cfg.norsk.match || cfg.norsk.words || cfg.norsk.rhyme;
          const anyMatte = cfg.matte.intro || cfg.matte.neighbors || cfg.matte.quantity;
          if (!anyNorsk && anyMatte) cfg.norsk.show = false;
          if (!anyMatte && anyNorsk) cfg.matte.show = false;

          saveSettings();
          renderSidebarCards();
          renderSheets();
        });
      });

      container.appendChild(card);
    }
  }

  // BYGG ETT BREDT BOKSTAVHUS (SVG) MED RØDT TAK FOR VOKALER OG BLÅTT TAK FOR KONSONANTER
  function renderBokstavhusSVG(upper) {
    const lower = upper.toLowerCase();
    const vokaler = ["a", "e", "i", "o", "u", "y", "æ", "ø", "å"];
    const isVowel = vokaler.includes(lower);
    const roofColor = isVowel ? "#ef1c1c" : "#0284c7";
    const roofLabel = isVowel ? "BOKSTAVHUS - VOKAL" : "BOKSTAVHUS - KONSONANT";
    const fontSize = 104;
    const baselineY = 128;

    return `
      <svg class="bokstavhus-svg" viewBox="0 0 660 165" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${roofLabel} ${upper} ${lower}">
        <!-- Pipe og røyk -->
        <path d="M566 22 C563 16, 568 10, 573 11 C577 8, 584 10, 584 15 C588 17, 587 23, 582 24 Z" fill="#64748b" />
        <rect x="566" y="21" width="14" height="14" fill="#0f172a" />

        <!-- Trapesformet tak (rødt for vokal, blått for konsonant) -->
        <polygon points="56,28 604,28 656,52 4,52" fill="${roofColor}" stroke="#0f172a" stroke-width="2.2" stroke-linejoin="round" />
        <text x="330" y="45" text-anchor="middle" fill="#ffffff" font-family="Trykkskrift, sans-serif" font-size="15.5" font-weight="700" letter-spacing="1.8">${roofLabel}</text>

        <!-- Husvegger (loft, stue, kjeller) -->
        <rect x="16" y="52" width="628" height="106" fill="#ffffff" stroke="#0f172a" stroke-width="1.6" />

        <!-- Stiplet linje mellom loft og stue -->
        <line x1="16" y1="90" x2="644" y2="90" stroke="#0f172a" stroke-width="1.8" stroke-dasharray="4 4" />

        <!-- Tykk grunnlinje mellom stue og kjeller -->
        <line x1="16" y1="128" x2="644" y2="128" stroke="#0f172a" stroke-width="3.2" />

        <!-- Ukens bokstav i Trykkskrift-fonten (hel, lys grå sporbokstav) -->
        <text x="34" y="${baselineY}" font-family="Trykkskrift, sans-serif" font-size="${fontSize}" letter-spacing="6" fill="#64748b">${upper}${lower}</text>
      </svg>
    `;
  }

  // BYGG BREDE BOKSTAVHUS UTEN TAK OG PIPE FOR OPPGAVE 3 (EKSAKT SAMME LINJEHØYDE SOM OPPGAVE 1)
  function renderOrdhusSVG(word) {
    const fontSize = 104;
    const baselineY = 80;

    return `
      <svg class="ordhus-svg" viewBox="0 0 820 116" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Skrivelinjer for ${word}">
        <!-- Husvegger uten tak (loft 38px, stue 38px, kjeller 30px) -->
        <rect x="2" y="4" width="816" height="106" fill="#ffffff" stroke="#0f172a" stroke-width="1.6" />

        <!-- Stiplet linje mellom loft og stue -->
        <line x1="2" y1="42" x2="818" y2="42" stroke="#0f172a" stroke-width="1.8" stroke-dasharray="4 4" />

        <!-- Tykk grunnlinje mellom stue og kjeller -->
        <line x1="2" y1="80" x2="818" y2="80" stroke="#0f172a" stroke-width="3.2" />

        <!-- Grått sporingsord i starten av linjene -->
        <text x="18" y="${baselineY}" font-family="Trykkskrift, sans-serif" font-size="${fontSize}" fill="#64748b">${word}</text>
      </svg>
    `;
  }

  // BYGG BILDE FOR ORD (bilder/ord.png) MED EMOJI SOM RESERVE HVIS BILDET MANGLER
  function renderWordImgHTML(item) {
    const slug = (item.bilde || item.ord || "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "_");
    const fallback = item.emoji
      ? `<span class="word-emoji-fallback" style="display:none;">${item.emoji}</span>`
      : "";
    return `
      <img src="bilder/${slug}.png" alt="${item.ord}" class="word-icon-img"
           onerror="this.style.display='none';if(this.nextElementSibling)this.nextElementSibling.style.display='inline-block';" />
      ${fallback}
    `;
  }

// RENDER NORSK SEKSJON (EGEN A4-SIDE)
  function renderNorskBodyHTML(norsk, cfg) {
    const letters = getLetters(norsk);
    if (!norsk || letters.length === 0) return "";

    let taskNum = 1;
    let html = `<section class="subject-section norsk full-page-section">`;

    if (cfg.intro) {
      const letterRowsHTML = letters
        .map((upper) => {
          const lower = upper.toLowerCase();
          return `
            <div class="letter-pair-row">
              <div class="media-box">
                <img src="bokstaver/bokstav/bokst_${lower}.png" alt="Bokstav ${upper} ${lower}"
                     onerror="this.style.display='none';this.nextElementSibling.style.display='block';" />
                <div class="fallback-letter" style="display:none;">${upper} ${lower}</div>
              </div>
              <div class="bokstavhus-wrapper">
                ${renderBokstavhusSVG(upper)}
              </div>
            </div>`;
        })
        .join("");

      html += `
        <div class="task-block">
          <p class="task-title">${taskNum++}. Spor skriveretning og øv på å skrive bokstavene i bokstavhuset:</p>
          <div class="letter-intro-stack">
            ${letterRowsHTML}
          </div>
        </div>`;
    }

    if (cfg.match && Array.isArray(norsk.strekOrd)) {
      const leftItems = norsk.strekOrd.slice(0, 3);
      const rightItems = norsk.strekOrd.slice(3, 6);
      const vokaler = ["a", "e", "i", "o", "u", "y", "æ", "ø", "å"];

      const coloredLetters = letters
        .map((upper) => {
          const lower = upper.toLowerCase();
          const cls = vokaler.includes(lower) ? "vowel-letter" : "consonant-letter";
          return `<span class="task-letter ${cls}">${lower}</span>`;
        })
        .join(" eller ");

      const coloredBadgeHTML = letters
        .map((upper) => {
          const lower = upper.toLowerCase();
          const cls = vokaler.includes(lower) ? "vowel-letter" : "consonant-letter";
          return `<span class="badge-letter-pair ${cls}">${upper}${lower}</span>`;
        })
        .join(" ");

      html += `
        <div class="task-block">
          <p class="task-title">${taskNum++}. Sett strek fra bokstavene til bildene som begynner på ${coloredLetters}:</p>
          <div class="match-grid">
            <div class="match-col left-col">
              ${leftItems
                .map(
                  (item) => `
                <div class="match-item">
                  <span class="match-word-wrap">${renderWordImgHTML(item)}</span>
                </div>`
                )
                .join("")}
            </div>
            <div class="center-letter-badge">${coloredBadgeHTML}</div>
            <div class="match-col right-col">
              ${rightItems
                .map(
                  (item) => `
                <div class="match-item">
                  <span class="match-word-wrap">${renderWordImgHTML(item)}</span>
                </div>`
                )
                .join("")}
            </div>
          </div>
        </div>`;
    }

    if (cfg.words && Array.isArray(norsk.skriveOrd)) {
      const wordsToRender = cfg.onlyFirstWord ? norsk.skriveOrd.slice(0, 1) : norsk.skriveOrd;
      const taskText = cfg.onlyFirstWord
        ? "Spor ordet og skriv det på linjen:"
        : "Spor ordene og skriv dem på linjene:";

      html += `
        <div class="task-block">
          <p class="task-title">${taskNum++}. ${taskText}</p>
          <div class="word-houses-stack">
            ${wordsToRender
              .map((w) => `<div class="word-house-row">${renderOrdhusSVG(w.ord)}</div>`)
              .join("")}
          </div>
        </div>`;
    }

if (cfg.rhyme && Array.isArray(norsk.rimOrd) && norsk.rimOrd.length >= 4) {
      const oppsett = (norsk.rimOppsett || "kryss").toLowerCase();
      const isThreePairs = norsk.rimOrd.length >= 6;
      let rhymeHTML = "";

if (isThreePairs) {
        // 3 rimpar (6 bilder): 3 bilder på øverste rad, 3 bilder på nederste rad
        let topRhyme, bottomRhyme;

        if (oppsett === "rett") {
          // Rett over hverandre: Par 1, Par 2, Par 3
          topRhyme = [norsk.rimOrd[0], norsk.rimOrd[2], norsk.rimOrd[4]];
          bottomRhyme = [norsk.rimOrd[1], norsk.rimOrd[3], norsk.rimOrd[5]];
        } else if (oppsett === "oppned") {
          // Parvis ved siden av hverandre på radene
          topRhyme = [norsk.rimOrd[0], norsk.rimOrd[1], norsk.rimOrd[2]];
          bottomRhyme = [norsk.rimOrd[4], norsk.rimOrd[5], norsk.rimOrd[3]];
        } else if (oppsett === "miks") {
          // Alternativ kryssing: Par 2 - Par 3 - Par 1 nederst
          topRhyme = [norsk.rimOrd[0], norsk.rimOrd[2], norsk.rimOrd[4]];
          bottomRhyme = [norsk.rimOrd[3], norsk.rimOrd[5], norsk.rimOrd[1]];
        } else {
          // "kryss" (standard): Par 3 - Par 1 - Par 2 nederst
          topRhyme = [norsk.rimOrd[0], norsk.rimOrd[2], norsk.rimOrd[4]];
          bottomRhyme = [norsk.rimOrd[5], norsk.rimOrd[1], norsk.rimOrd[3]];
        }

        rhymeHTML = `
          <div class="rhyme-grid-horizontal">
            <div class="rhyme-row top-row">
              ${topRhyme.map((item) => `<div class="rhyme-item">${renderWordImgHTML(item)}</div>`).join("")}
            </div>
            <div class="rhyme-row bottom-row">
              ${bottomRhyme.map((item) => `<div class="rhyme-item">${renderWordImgHTML(item)}</div>`).join("")}
            </div>
          </div>`;
      } else {
        // 2 rimpar (4 bilder): Eksisterende venstre/høyre-oppsett
        let leftRhyme, rightRhyme;

        if (oppsett === "rett") {
          leftRhyme = [norsk.rimOrd[0], norsk.rimOrd[2]];
          rightRhyme = [norsk.rimOrd[1], norsk.rimOrd[3]];
        } else if (oppsett === "oppned") {
          leftRhyme = [norsk.rimOrd[0], norsk.rimOrd[1]];
          rightRhyme = [norsk.rimOrd[2], norsk.rimOrd[3]];
        } else {
          leftRhyme = [norsk.rimOrd[0], norsk.rimOrd[2]];
          rightRhyme = [norsk.rimOrd[3], norsk.rimOrd[1]];
        }

        rhymeHTML = `
          <div class="rhyme-grid">
            <div class="rhyme-col left-col">
              ${leftRhyme.map((item) => `<div class="rhyme-item">${renderWordImgHTML(item)}</div>`).join("")}
            </div>
            <div class="rhyme-col right-col">
              ${rightRhyme.map((item) => `<div class="rhyme-item">${renderWordImgHTML(item)}</div>`).join("")}
            </div>
          </div>`;
      }

      html += `
        <div class="task-block">
          <p class="task-title">${taskNum++}. Sett strek mellom ordene som rimer:</p>
          ${rhymeHTML}
        </div>`;
    }

    html += `</section>`;
    return html;
  }


// VEKTORBANER OG SKRIVERETNING FOR TALL 0–9 (TOR-TRYKKSKRIFT-STIL)
  const DIGIT_TRACING_DATA = {
    0: {
      viewWidth: 74,
      strokes: ["M 49,21 A 23,36 0 1,0 59,50 A 23,36 0 0,0 49,21"],
      startMarker: "M 54,28 A 23,36 0 0,0 38,14",
      arrows: [{ d: "M 59,24 A 27,40 0 0,0 39,9", tip: "39,9 44,6 44,12" }]
    },
    1: {
      viewWidth: 44,
      strokes: ["M 22,14 L 22,86"],
      startMarker: "M 22,14 L 22,38",
      arrows: [{ d: "M 13,14 L 13,34", tip: "13,34 10,28 16,28" }]
    },
    2: {
      viewWidth: 70,
      strokes: ["M 15,33 C 15,10 55,10 55,33 C 55,52 15,72 14,86 L 56,86"],
      startMarker: "M 15,33 C 15,19 25,14 36,14",
      arrows: [{ d: "M 9,31 C 10,16 20,9 32,8", tip: "32,8 26,6 27,12" }]
    },
    3: {
      viewWidth: 70,
      strokes: [
        "M 16,29 C 18,10 53,10 53,31 C 53,45 41,49 31,49",
        "M 31,49 C 43,49 56,54 56,69 C 56,89 16,90 14,71"
      ],
      startMarker: "M 16,29 C 17,18 26,14 36,14",
      arrows: [{ d: "M 10,27 C 12,15 21,9 32,8", tip: "32,8 26,6 27,12" }]
    },
    4: {
      viewWidth: 74,
      strokes: [
        "M 21,14 L 21,57 L 60,57",
        "M 47,14 L 47,86"
      ],
      startMarker: "M 21,14 L 21,36",
      arrows: [
        { d: "M 12,14 L 12,33", tip: "12,33 9,27 15,27" },
        { d: "M 55,14 L 55,33", tip: "55,33 52,27 58,27", label: "2", lx: 60, ly: 23 }
      ]
    },
5: {
      viewWidth: 76,
      strokes: [
        "M 24,16 L 24,47 C 38,40 60,45 60,66 C 60,89 23,90 20,71",
        "M 24,16 L 58,16"
      ],
      startMarker: "M 24,16 L 24,37",
      arrows: [
        { d: "M 15,16 L 15,35", tip: "15,35 12,29 18,29", label: "1", lx: 4, ly: 17 },
        { d: "M 25,8 L 50,8", tip: "50,8 44,5 44,11", label: "2", lx: 25, ly: -4 }
      ]
    },
    6: {
      viewWidth: 72,
      strokes: ["M 45,14 L 19,55 A 20,21 0 1,0 55,65 A 20,21 0 0,0 19,55"],
      startMarker: "M 45,14 L 35,30",
      arrows: [{ d: "M 37,12 L 28,26", tip: "28,26 28,20 33,23" }]
    },
    7: {
      viewWidth: 70,
      strokes: ["M 14,14 L 56,14 L 27,86"],
      startMarker: "M 14,14 L 44,14",
      arrows: [{ d: "M 15,6 L 46,6", tip: "46,6 40,3 40,9" }]
    },
8: {
      viewWidth: 72,
      strokes: [
        "M 51,28 C 51,11 21,11 21,29 C 21,42 36,47 36,49 C 36,51 54,56 54,70 C 54,89 18,89 18,70 C 18,56 36,51 36,49 C 36,47 51,42 51,28 Z"
      ],
      startMarker: "M 51,28 C 51,19 44,15 36,15",
      arrows: [
        { d: "M 57,26 C 56,15 48,9 37,9", tip: "37,9 43,6 43,12" }
      ]
    },
    9: {
      viewWidth: 72,
      strokes: ["M 53,45 A 20,20 0 1,0 17,34 A 20,20 0 0,0 53,45 L 27,86"],
      startMarker: "M 55,34 A 20,20 0 0,0 36,14",
      arrows: [{ d: "M 60,31 A 25,24 0 0,0 37,8", tip: "37,8 43,5 43,11" }]
    }
  };

  function buildNumberCellSVG(numStr, mode) {
    const digits = numStr.split("");
    if (digits.some((d) => !DIGIT_TRACING_DATA[d])) {
      const fill = mode === "solid" ? "#1e293b" : "#cbd5e1";
      return `<svg class="number-trace-svg" viewBox="0 -8 ${totalW} 106" xmlns="http://www.w3.org/2000/svg">${innerSVG}</svg>`;
    }

    const gap = digits.length > 1 ? 4 : 0;
    const totalW = digits.reduce((sum, d) => sum + DIGIT_TRACING_DATA[d].viewWidth, 0) + gap * (digits.length - 1);
    let offsetX = 0;
    let innerSVG = "";

    digits.forEach((d) => {
      const spec = DIGIT_TRACING_DATA[d];
      innerSVG += `<g transform="translate(${offsetX}, 0)">`;

      if (mode === "solid") {
        spec.strokes.forEach((pathD) => {
          innerSVG += `<path d="${pathD}" fill="none" stroke="#1e293b" stroke-width="5.2" stroke-linecap="round" stroke-linejoin="round" />`;
        });
      } else {
        spec.strokes.forEach((pathD) => {
          innerSVG += `<path d="${pathD}" fill="none" stroke="#94a3b8" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="0.1 7.6" />`;
        });
        if (mode === "guided") {
          innerSVG += `<path d="${spec.startMarker}" fill="none" stroke="#1e293b" stroke-width="5.2" stroke-linecap="round" />`;
          spec.arrows.forEach((arr) => {
            innerSVG += `<path d="${arr.d}" fill="none" stroke="#1e293b" stroke-width="1.8" stroke-linecap="round" />`;
            innerSVG += `<polygon points="${arr.tip}" fill="#1e293b" />`;
            if (arr.label) {
              innerSVG += `<text x="${arr.lx}" y="${arr.ly + 9}" font-family="Trykkskrift, sans-serif" font-size="13" font-weight="700" fill="#1e293b">${arr.label}</text>`;
            }
          });
        }
      }

      innerSVG += `</g>`;
      offsetX += spec.viewWidth + gap;
    });

    return `<svg class="number-trace-svg" viewBox="0 -4 ${totalW} 102" xmlns="http://www.w3.org/2000/svg">${innerSVG}</svg>`;
  }

function renderNumberPracticeGridHTML(tall) {
    const numStr = String(tall);
    const cells = [
      buildNumberCellSVG(numStr, "solid"),
      buildNumberCellSVG(numStr, "guided"),
      buildNumberCellSVG(numStr, "dotted"),
      "", "", "", "", ""
    ];

    return `
      <div class="number-practice-grid" role="img" aria-label="Øv på å skrive tallet ${numStr}">
        ${cells.map((content) => `<div class="number-practice-cell">${content}</div>`).join("")}
      </div>
    `;
  }


// RENDER MATTE SEKSJON (EGEN A4-SIDE)
  function renderMatteBodyHTML(matte, cfg) {
    if (!matte) return "";
    const padded = String(matte.tall).padStart(2, "0");

const renderSymbols = (item, cssClass, maxPerRow = 0) => {
      const sym = String(item.symbol || "●");
      const isImg = /\.(png|jpe?g|svg|webp)$/i.test(sym) || sym.includes("/");
      const single = isImg
        ? `<img src="${sym}" alt="" class="${cssClass}">`
        : `<span>${sym}</span>`;
      return Array.from({ length: item.antall }, (_, idx) => {
        const lineBreak = maxPerRow > 0 && idx > 0 && idx % maxPerRow === 0
          ? `<span class="symbol-row-break"></span>`
          : "";
        return lineBreak + single;
      }).join("");
    };

    let taskNum = 1;
    let html = `<section class="subject-section matte full-page-section">
      <div class="matte-hero-wrap">
        <img src="bilder/tall_${padded}.png" alt="Tallet ${matte.tall}" class="matte-hero-img" onerror="this.parentElement.style.display='none'">
      </div>`;

    if (cfg.intro) {
      html += `
        <div class="task-block">
          <p class="task-title">${taskNum++}. Spor skriveretning og øv på å skrive tallet ${matte.tall}:</p>
          ${renderNumberPracticeGridHTML(matte.tall)}
        </div>`;
    }

    const hasDice = Boolean(cfg.dice && matte.tall !== undefined);
    const hasNeighbors = Boolean(cfg.neighbors && Array.isArray(matte.nabotall));

    if (hasDice || hasNeighbors) {
      const diceCount = Math.max(1, Math.ceil(Number(matte.tall) / 6));
      const diceSVG = `
        <svg class="dice-svg" viewBox="0 0 100 100" aria-label="Tom terning" xmlns="http://www.w3.org/2000/svg">
          <!-- Ytre terningkropp med skyggefulle hjørner -->
          <rect x="6" y="6" width="88" height="88" rx="18" fill="#cbd5e1" stroke="#1e293b" stroke-width="3.2"/>
          <!-- Den store, avrundede spillflaten i midten -->
          <rect x="9" y="9" width="82" height="82" rx="34" fill="#ffffff"/>
          <!-- Diskret lyskant øverst til venstre for ekstra terningfølelse -->
          <path d="M 14,34 A 24,24 0 0,1 34,14" fill="none" stroke="#f8fafc" stroke-width="3" stroke-linecap="round"/>
          <!-- Ytre kontur tegnet på nytt øverst for sylskarp kant -->
          <rect x="6" y="6" width="88" height="88" rx="18" fill="none" stroke="#1e293b" stroke-width="3.2"/>
        </svg>`;
      const diceBoxesHTML = Array.from({ length: diceCount }, () => diceSVG).join("");

      html += `
        <div class="task-block ${hasDice && hasNeighbors ? "task-block-split" : ""}">
          ${hasDice ? `
            <div class="task-split-col">
              <p class="task-title">${taskNum++}. Tegn ${matte.tall} ${Number(matte.tall) === 1 ? "prikk" : "prikker"} på ${diceCount > 1 ? "terningene" : "terningen"}:</p>
              <div class="dice-area">
                ${diceBoxesHTML}
              </div>
            </div>
          ` : ""}
          ${hasNeighbors ? `
            <div class="task-split-col">
              <p class="task-title">${taskNum++}. Skriv nabotallene som mangler:</p>
              <div class="neighbor-rows">
                ${matte.nabotall
                  .map(
                    (row) => `
                  <div class="neighbor-row">
                    ${row
                      .map((val, idx) => {
                        const cell = val === null ? `<span class="num-box"></span>` : `<span class="num-box filled">${val}</span>`;
                        return idx < row.length - 1 ? `${cell}<span class="dash">–</span>` : cell;
                      })
                      .join("")}
                  </div>`
                  )
                  .join("")}
              </div>
            </div>
          ` : ""}
        </div>`;
    }

    if (cfg.quantity && Array.isArray(matte.mengder)) {
      html += `
        <div class="task-block">
          <p class="task-title">${taskNum++}. Sett ring rundt boksene som har lik mengde som ukens tall (${matte.tall}):</p>
          <div class="quantity-grid">
            ${matte.mengder
              .map(
                (m) => `
              <div class="quantity-card">
                ${renderSymbols(m, "quantity-img", 5)}
              </div>`
              )
              .join("")}
          </div>
        </div>`;
    }

if (cfg.count && Array.isArray(matte.telleOppgaver)) {
      html += `
        <div class="task-block">
          <p class="task-title">${taskNum++}. Tell figurene og skriv riktig tall i ruten:</p>
          <div class="count-grid">
            ${matte.telleOppgaver
              .slice(0, 3)
              .map(
                (item) => `
              <div class="count-card">
                <div class="count-symbols">${renderSymbols(item, "count-img", 4)}</div>
                <span class="num-box count-answer"></span>
              </div>`
              )
              .join("")}
          </div>
        </div>`;
    }

    html += `</section>`;
    return html;
  }


// BYGG ENKELT A4-SIDE
  function createA4PageElement({ id, title, weekLabel, subjectTag, bodyHTML, pageIndex, totalPages }) {
    const article = document.createElement("article");
    article.id = id;

    if (id === "sheet-page-cover-back") {
      article.className = "a4-sheet cover-back-sheet";
    } else if (subjectTag === "Oversikt") {
      article.className = "a4-sheet toc-sheet";
    } else if (subjectTag === "Skriving") {
      article.className = "a4-sheet norsk-sheet";
    } else {
      article.className = "a4-sheet";
    }

    const parts = title.split(/\s*[–-]\s*/);
    const baseTitle = parts[0] || title;
    const rawDetail = parts.slice(1).join(" - ").trim();
    const sheetNumMatch = baseTitle.match(/\d+/);
    const sheetNum = sheetNumMatch ? sheetNumMatch[0] : "";

    let formattedTitle = title;
    if (subjectTag === "Skriving" && rawDetail) {
      formattedTitle = `${baseTitle} - Bokstavene: ${rawDetail.toLowerCase()}`;
    } else if (subjectTag === "Regning" || subjectTag === "Matematikk") {
      const matteObj = sheetNum && window.MATTE_DATA ? window.MATTE_DATA[sheetNum] : null;
      const numVal = matteObj && matteObj.tall !== undefined ? matteObj.tall : sheetNum;
      const numWord = (matteObj && (matteObj.tallOrd || matteObj.ord)) || NUMBER_WORDS[numVal] || "";
      formattedTitle = numVal
        ? `${baseTitle} - Tallet: ${numVal}${numWord ? ` - ${numWord}` : ""}`
        : baseTitle;
    }

    const hideHeaderFooter = id === "sheet-page-cover-back" || id === "sheet-page-cover";

    article.innerHTML = `
      <div class="sheet-inner-top">
        ${hideHeaderFooter ? "" : `
          <header class="sheet-header">
            <div class="sheet-title-block">
              <h1>${formattedTitle}</h1>
            </div>
            <div class="student-meta">
              <span>Hånes skole${weekLabel ? ` • ${weekLabel}` : ""}</span>
            </div>
          </header>
        `}

        ${bodyHTML}
      </div>

      ${hideHeaderFooter ? "" : `
        <footer class="sheet-footer ${!showPageNumbers ? "hide-pagenum" : ""}">
          <span>Hånes skole</span>
          <span class="page-num-text">Side ${pageIndex} av ${totalPages}</span>
        </footer>
      `}
    `;

    return article;
  }


    const NUMBER_WORDS = {
      1: "en", 2: "to", 3: "tre", 4: "fire", 5: "fem",
      6: "seks", 7: "sju", 8: "åtte", 9: "ni", 10: "ti",
      11: "elleve", 12: "tolv", 13: "tretten", 14: "fjorten", 15: "femten",
      16: "seksten", 17: "sytten", 18: "atten", 19: "nitten", 20: "tjue"
    };


// RENDER ALLE SYNLIGE A4-SIDER (NORSK OG MATTE HVER FOR SEG)
  function renderSheets() {

    const sheetsContainerEl = document.getElementById("sheets-container");
    sheetsContainerEl.innerHTML = "";

    const cfg0 = sheetSettings[0] || { visible: true, showToc: true };
    const showCover = Boolean(cfg0.visible);
    const showToc = Boolean(cfg0.visible && cfg0.showToc);
    const showCoverBack = Boolean(showCover && showToc);

    const taskPages = [];
    const tocEntries = [];
    let currentPageNum = 1 + (showCover ? 1 : 0) + (showToc ? 1 : 0) + (showCoverBack ? 1 : 0);

    for (let i = 1; i <= TOTAL_SHEETS; i++) {
      const cfg = sheetSettings[i];
      if (!cfg.visible) continue;

      const norsk = window.NORSK_DATA[i];
      const matte = window.MATTE_DATA[i];
      const letterLabel = getLetters(norsk).join("").toLowerCase();
      const titleSuffix = letterLabel ? ` – ${letterLabel}` : "";

      const hasNorsk = Boolean(cfg.norsk.show && norsk);
      const hasMatte = Boolean(cfg.matte.show && matte);

      if (!hasNorsk && !hasMatte) continue;

      const startPage = currentPageNum;
      const subjects = [];

      if (hasNorsk) {
        taskPages.push({
          id: `sheet-page-${i}-norsk`,
          title: `Arbeidsark ${i}${titleSuffix}`,
          weekLabel: cfg.weekLabel,
          subjectTag: "Skriving",
          bodyHTML: renderNorskBodyHTML(norsk, cfg.norsk)
        });
        subjects.push("Skriving");
        currentPageNum++;
      }

      if (hasMatte) {
        taskPages.push({
          id: `sheet-page-${i}-matte`,
          title: `Arbeidsark ${i}${titleSuffix}`,
          weekLabel: cfg.weekLabel,
          subjectTag: "Regning",
          bodyHTML: renderMatteBodyHTML(matte, cfg.matte)
        });
        subjects.push("Regning");
        currentPageNum++;
      }

const endPage = currentPageNum - 1;
      const pageRange = startPage === endPage ? `${startPage}` : `${startPage}–${endPage}`;

      const lettersStr = hasNorsk ? getLetters(norsk).join(", ") : "";
      const numVal = matte && matte.tall !== undefined ? matte.tall : i;
      const numWord = (matte && (matte.tallOrd || matte.ord)) || NUMBER_WORDS[numVal] || "";
      const numberStr = hasMatte ? `${numVal}${numWord ? ` - ${numWord}` : ""}` : "";

      const topicParts = [];
      if (lettersStr) topicParts.push(`Bokstaver: <strong>${lettersStr}</strong>`);
      if (numberStr) topicParts.push(`Tallet: <strong>${numberStr}</strong>`);

      tocEntries.push({
        sheetNum: i,
        weekLabel: cfg.weekLabel || (norsk && norsk.uke) || "",
        topicHTML: topicParts.join(" &amp; "),
        subjects: subjects.join(" & "),
        pageRange
      });
    }

    const pagesToRender = [];

    // 1. FORSIDE (SIDE 1)
    if (showCover) {
      pagesToRender.push({
        id: "sheet-page-cover",
        title: "",
        weekLabel: "",
        subjectTag: "",
        isCover: true,
        bodyHTML: `
          <div class="hefte-cover">
            <div class="cover-badge">Arbeidshefte</div>
            <h1 class="cover-title">Skriving & Regning</h1>
            <img src="bilder/forside_arbeidshefte.png" alt="Forsideillustrasjon" class="cover-image" />
            <div class="cover-name-box">
              <label>Navn:</label>
              <div class="cover-line"></div>
              <label>Klasse:</label>
              <div class="cover-line"></div>
            </div>
          </div>
        `
      });
    }


// 2. INNHOLDSFORTEGNELSE (SIDE 2)
    if (showToc) {
      const tocRowsHTML = tocEntries.length > 0
        ? tocEntries.map((entry) => `
            <div class="toc-row">
              <div class="toc-left">
                <span class="toc-sheet">Arbeidsark ${entry.sheetNum}</span>
                ${entry.weekLabel ? `<span class="toc-week">(${entry.weekLabel})</span>` : ""}
                ${entry.topicHTML ? `<span class="toc-letters">${entry.topicHTML}</span>` : ""}
              </div>
              <div class="toc-dots"></div>
              <div class="toc-right">
                <span class="toc-subjects">${entry.subjects}</span>
                <span class="toc-page">s. ${entry.pageRange}</span>
              </div>
            </div>
          `).join("")
        : `<p class="toc-empty">Ingen arbeidsark er valgt for visning.</p>`;

      pagesToRender.push({
        id: "sheet-page-toc",
        title: "Innholdsfortegnelse",
        weekLabel: "",
        subjectTag: "Oversikt",
        isToc: true,
        bodyHTML: `
          <div class="hefte-toc">
            <p class="toc-intro">Oversikt over utvalgte arbeidsark i dette heftet:</p>
            <div class="toc-list">
              ${tocRowsHTML}
            </div>
          </div>
        `
      });
    }

    // 3. MELLOMSIDE I ARK 0 (SIDE 3: SVAK FORSIDE UTEN NAVN/KLASSE)
    if (showCoverBack) {
      pagesToRender.push({
        id: "sheet-page-cover-back",
        title: "",
        weekLabel: "",
        subjectTag: "",
        isCover: true,
        bodyHTML: `
          <div class="hefte-cover hefte-cover-faded">
            <div class="cover-badge">Arbeidshefte</div>
            <h1 class="cover-title">Skriving & Regning</h1>
            <img src="bilder/forside_arbeidshefte.png" alt="Forsideillustrasjon" class="cover-image" />
          </div>
        `
      });
    }

    // 4. ARBEIDSARK (STARTER PÅ SIDE 4 = VENSTRE SIDE)
    pagesToRender.push(...taskPages);

    pagesToRender.forEach((pageData, idx) => {
      const pageEl = createA4PageElement({
        ...pageData,
        pageIndex: idx + 1,
        totalPages: pagesToRender.length
      });
      sheetsContainerEl.appendChild(pageEl);
    });
  }


function setupPrintModals() {
    const printBtn = document.getElementById("btn-print") || document.querySelector(".btn-print-main");
    const optionsModal = document.getElementById("print-options-modal");
    const guideModal = document.getElementById("pdf-guide-modal");
    const readyModal = document.getElementById("pdf-ready-modal");
    const zoomModal = document.getElementById("guide-zoom-modal");

    if (!printBtn || !optionsModal) return;

    const scopeRadios = optionsModal.querySelectorAll('input[name="printScope"]');
    const includeArk0Cb = document.getElementById("print-include-ark0");
    const estimateEl = document.getElementById("print-estimate-text");
    const currentLabelEl = document.getElementById("print-current-label");

    let awaitingPdfSave = false;

    function getActiveSheetNum() {
      const activeCard = document.querySelector(".sheet-card.active");
      if (activeCard && activeCard.dataset && activeCard.dataset.sheet) {
        const num = parseInt(activeCard.dataset.sheet, 10);
        if (num >= 1) return num;
      }
      return 1;
    }

    function updatePrintEstimate() {
      const scope = optionsModal.querySelector('input[name="printScope"]:checked').value;
      const activeNum = getActiveSheetNum();
      currentLabelEl.textContent = `Arbeidsark ${activeNum}`;

      document.getElementById("print-scope-selected-card").classList.toggle("active", scope === "selected");
      document.getElementById("print-scope-current-card").classList.toggle("active", scope === "current");

      let totalPages = 0;

      if (scope === "selected") {
        if (includeArk0Cb.checked) {
          const cfg0 = sheetSettings[0] || { visible: true, showToc: true };
          totalPages += cfg0.showToc ? 3 : 1;
        }
        for (let i = 1; i <= TOTAL_SHEETS; i++) {
          const cfg = sheetSettings[i];
          if (!cfg || !cfg.visible) continue;
          if (cfg.norsk && cfg.norsk.show && window.NORSK_DATA[i]) totalPages++;
          if (cfg.matte && cfg.matte.show && window.MATTE_DATA[i]) totalPages++;
        }
      } else {
        if (includeArk0Cb.checked) {
          const cfg0 = sheetSettings[0] || { visible: true, showToc: true };
          totalPages += cfg0.showToc ? 3 : 1;
        }
        const cfg = sheetSettings[activeNum];
        if (cfg) {
          if (cfg.norsk && cfg.norsk.show && window.NORSK_DATA[activeNum]) totalPages++;
          if (cfg.matte && cfg.matte.show && window.MATTE_DATA[activeNum]) totalPages++;
        }
      }

      const physicalSheets = Math.ceil(totalPages / 2);
      estimateEl.textContent = `${physicalSheets} ark (${totalPages} sider)`;
    }

    function applyPrintFilterAndPrint() {
      const scope = optionsModal.querySelector('input[name="printScope"]:checked').value;
      const includeArk0 = includeArk0Cb.checked;
      const activeNum = getActiveSheetNum();

      const prevArk0Visible = sheetSettings[0] ? sheetSettings[0].visible : true;
      let rerendered = false;

      if (sheetSettings[0] && sheetSettings[0].visible !== includeArk0) {
        sheetSettings[0].visible = includeArk0;
        renderSheets();
        rerendered = true;
      }

      const allSheets = document.querySelectorAll(".a4-sheet");
      allSheets.forEach((el) => {
        el.classList.remove("print-skip");
        if (scope === "current") {
          const isArk0 = el.id === "sheet-page-cover" || el.id === "sheet-page-toc" || el.id === "sheet-page-cover-back";
          const isTargetSheet = el.id.startsWith(`sheet-page-${activeNum}-`);
          if (!isTargetSheet && !(includeArk0 && isArk0)) {
            el.classList.add("print-skip");
          }
        }
      });

      window.print();

      // Tilbakestill visning etter utskrift
      document.querySelectorAll(".a4-sheet.print-skip").forEach((el) => el.classList.remove("print-skip"));
      if (rerendered && sheetSettings[0]) {
        sheetSettings[0].visible = prevArk0Visible;
        renderSheets();
      }
    }

    // Åpne Modal 1 når brukeren klikker på "Skriv ut" i venstremenyen
    printBtn.addEventListener("click", (e) => {
      e.preventDefault();
      includeArk0Cb.checked = sheetSettings[0] ? Boolean(sheetSettings[0].visible) : true;
      updatePrintEstimate();
      optionsModal.classList.remove("hidden");
    });

    scopeRadios.forEach((r) => r.addEventListener("change", updatePrintEstimate));
    includeArk0Cb.addEventListener("change", updatePrintEstimate);

    // Vanlig utskrift
    document.getElementById("btn-do-normal-print").addEventListener("click", () => {
      optionsModal.classList.add("hidden");
      applyPrintFilterAndPrint();
    });

    // Videre til Modal 2 (Lag PDF for hefte)
    document.getElementById("btn-open-pdf-guide").addEventListener("click", () => {
      optionsModal.classList.add("hidden");
      guideModal.classList.remove("hidden");
    });

    // Fortsett og lagre PDF -> åpner utskriftsdialog og hopper til Modal 3 etterpå
    document.getElementById("btn-continue-save-pdf").addEventListener("click", () => {
      guideModal.classList.add("hidden");
      awaitingPdfSave = true;
      applyPrintFilterAndPrint();
    });

    window.addEventListener("afterprint", () => {
      if (awaitingPdfSave) {
        awaitingPdfSave = false;
        readyModal.classList.remove("hidden");
      }
    });

// Velg og åpne lagret PDF-fil i ny fane i nettleseren
    const filePicker = document.getElementById("pdf-file-picker");
    let currentBlobUrl = null;

    document.getElementById("btn-open-saved-pdf").addEventListener("click", () => {
      filePicker.value = "";
      filePicker.click();
    });

    filePicker.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
      }
      currentBlobUrl = URL.createObjectURL(file);

      const linkWrap = document.getElementById("opened-pdf-link-wrap");
      const pdfLink = document.getElementById("opened-pdf-link");
      if (pdfLink && linkWrap) {
        pdfLink.href = currentBlobUrl;
        pdfLink.textContent = `📄 Åpne «${file.name}» i ny fane →`;
        linkWrap.classList.remove("hidden");
      }

      setTimeout(() => {
        window.open(currentBlobUrl, "_blank", "noopener");
      }, 150);
    });

    // Fanebytter (I nettleseren / I Adobe Reader)
    document.querySelectorAll(".pmodal-tabs").forEach((tabBar) => {
      tabBar.addEventListener("click", (e) => {
        const btn = e.target.closest(".pmodal-tab");
        if (!btn) return;
        const container = tabBar.closest(".pmodal-body");
        tabBar.querySelectorAll(".pmodal-tab").forEach((t) => t.classList.remove("active"));
        container.querySelectorAll(".pmodal-tab-pane").forEach((p) => p.classList.remove("active"));
        btn.classList.add("active");
        const target = document.getElementById(btn.dataset.tabTarget);
        if (target) target.classList.add("active");
      });
    });

    // Forstørr veiledningsbilde ved klikk
    document.querySelectorAll("[data-zoom-img]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        document.getElementById("guide-zoom-img").src = el.dataset.zoomImg;
        document.getElementById("guide-zoom-title").textContent = el.dataset.zoomTitle || "Veiledningsbilde";
        zoomModal.classList.remove("hidden");
      });
    });

    // Lukkeknapper og klikk utenfor modalboks
    document.querySelectorAll("[data-close-pmodal]").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.getElementById(btn.dataset.closePmodal).classList.add("hidden");
      });
    });

    [optionsModal, guideModal, readyModal, zoomModal].forEach((modal) => {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.classList.add("hidden");
      });
    });
  }

  // INIT
  initAuthWatermark();
  renderSidebarCards();
  renderSheets();
})();