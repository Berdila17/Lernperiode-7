
let alleLaender = []; 
let gefilterteLaender = [];
let nurFavoriten = false;
const favKey = "favCountries";
const favoriten = new Set(JSON.parse(localStorage.getItem(favKey) || "[]"));

const pageSize = 20;
let currentPage = 1;
let totalPages = 1;
let lastTotalItems = 0;
let compareNames = new Set();
const countriesEl   = document.getElementById("countries");
const statusEl      = document.getElementById("status");
const searchInput   = document.getElementById("searchInput");
const searchBtn     = document.getElementById("searchBtn");
const sortSelect    = document.getElementById("sortSelect");
const regionSelect  = document.getElementById("regionSelect");
const resetBtn      = document.getElementById("resetBtn");
const clearFavBtn   = document.getElementById("clearFavBtn");
const onlyFavCb     = document.getElementById("onlyFav");
const favInfo       = document.getElementById("favInfo");
const loadingBox    = document.getElementById("loading");
const paginationEl  = document.getElementById("pagination");
const suggestionsEl = document.getElementById("searchSuggestions");
const darkToggle   = document.getElementById("darkToggle");
const favViewBtn   = document.getElementById("toggleFavView");
const detailBox        = document.getElementById("detail");
const detailClose      = document.getElementById("detailClose");
const detailFlag       = document.getElementById("detailFlag");
const detailName       = document.getElementById("detailName");
const detailIso2       = document.getElementById("detailIso2");
const detailIso3       = document.getElementById("detailIso3");
const detailRegion     = document.getElementById("detailRegion");
const detailSubregion  = document.getElementById("detailSubregion");
const detailCapital    = document.getElementById("detailCapital");
const detailArea       = document.getElementById("detailArea");
const detailPopulation = document.getElementById("detailPopulation");
const compareSection = document.getElementById("compareSection");
const compareContent = document.getElementById("compareContent");
const compareInfo    = document.getElementById("compareInfo");
const compareClear   = document.getElementById("compareClear");
const toTopBtn = document.getElementById("toTopBtn");
const setStatus   = m => statusEl && (statusEl.textContent = m ?? "");
const showLoading = on => loadingBox && loadingBox.classList.toggle("hidden", !on);
const saveFavs    = () => localStorage.setItem(favKey, JSON.stringify([...favoriten]));
const updateFavInfo = () => favInfo && (favInfo.textContent = "Favoriten: " + favoriten.size);
const fmt = new Intl.NumberFormat("de-CH");

// Dark mode
const themeKey = "themeDark";

if (localStorage.getItem(themeKey) === "1") {
  document.body.classList.add("dark");
}

function updateDarkIcon() {
  if (!darkToggle) return;
  darkToggle.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
}
updateDarkIcon();

// Daten laden 
async function ladeLaender() {
  setStatus("Lade Länder…");
  showLoading(true);

  try {
    // 1) Flaggen und Namen
    const flagsRes = await fetch("https://countriesnow.space/api/v0.1/countries/flag/images");
    if (!flagsRes.ok) throw new Error("Flags-API nicht ok");
    const flagsJson = await flagsRes.json();
    const base = (flagsJson.data || []).map(x => ({
      name: x.name,
      flag: x.flag || x.flag_url,
      iso2: x.iso2,
      iso3: x.iso3
    }));

    // Region, Hauptstadt, Fläche, Population
    let enrichMap = new Map();
    try {
      const rcRes = await fetch(
        "https://restcountries.com/v3.1/all?fields=name,cca2,region,subregion,capital,area,population"
      );
      if (!rcRes.ok) throw new Error("Restcountries nicht ok");
      const rc = await rcRes.json();
      rc.forEach(item => {
        const iso2 = (item.cca2 || "").toUpperCase();
        const nameCommon = item.name?.common;
        const capital = Array.isArray(item.capital) ? item.capital[0] : item.capital;
        enrichMap.set(iso2, {
          region: item.region,
          subregion: item.subregion,
          population: item.population,
          area: item.area,
          capital,
          name: nameCommon
        });
      });
    } catch (e) {
      console.warn("Enrichment fehlgeschlagen – Zusatzdaten eingeschränkt.", e);
    }

    // Merge iso2
    alleLaender = base
      .map(c => {
        const add = c.iso2 ? enrichMap.get(c.iso2.toUpperCase()) : undefined;
        return {
          name: add?.name || c.name,
          flag: c.flag,
          iso2: c.iso2,
          iso3: c.iso3,
          region: add?.region,
          subregion: add?.subregion,
          capital: add?.capital,
          area: add?.area,
          population: add?.population
        };
      })
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    currentPage = 1;
    gefilterteLaender = alleLaender;
    render();
    setStatus(`${gefilterteLaender.length} Länder geladen.`);
  } catch (e) {
    console.error(e);
    setStatus("Fehler beim Laden der Länder 😢");
  } finally {
    showLoading(false);
  }
}

// Seitennummerierung rendern
function renderPagination() {
  if (!paginationEl) return;

  if (totalPages <= 1) {
    paginationEl.innerHTML = "";
    return;
  }

  paginationEl.innerHTML = `
    <button class="page-btn" data-page="prev" ${currentPage === 1 ? "disabled" : ""}>
      « Zurück
    </button>
    <span class="page-info">
      Seite ${currentPage} / ${totalPages} – insgesamt ${lastTotalItems} Länder
    </span>
    <button class="page-btn" data-page="next" ${currentPage === totalPages ? "disabled" : ""}>
      Weiter »
    </button>
  `;
}

// Rendern 
function render() {
  let liste = [...alleLaender];

  // Suche
  const q = (searchInput?.value || "").trim().toLowerCase();
  if (q) {
    liste = liste.filter(l => (l.name || "").toLowerCase().includes(q));
  }

  // Region
  const region = regionSelect?.value || "";
  if (region) {
    liste = liste.filter(
      l => (l.region || "").toLowerCase() === region.toLowerCase()
    );
  }

  // Nur Favoriten
  if (nurFavoriten || (onlyFavCb && onlyFavCb.checked)) {
    liste = liste.filter(l => favoriten.has(l.name));
  }

  // Sortierung 
  const mode = sortSelect?.value || "";
  switch (mode) {
    case "name-asc":
      liste.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      break;
    case "name-desc":
      liste.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
      break;
    case "pop-desc":
      liste.sort((a, b) => (b.population || 0) - (a.population || 0));
      break;
    case "pop-asc":
      liste.sort((a, b) => (a.population || 0) - (b.population || 0));
      break;
    case "area-desc":
      liste.sort((a, b) => (b.area || 0) - (a.area || 0));
      break;
    case "area-asc":
      liste.sort((a, b) => (a.area || 0) - (b.area || 0));
      break;
  }

  // Seitennummerierung
  gefilterteLaender = liste;
  lastTotalItems = liste.length;
  totalPages = Math.max(1, Math.ceil(lastTotalItems / pageSize));
  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * pageSize;
  const pageItems = liste.slice(start, start + pageSize);

  if (!pageItems.length) {
    countriesEl.innerHTML = '<p class="muted">Keine Länder gefunden.</p>';
    setStatus("0 Länder gefunden.");
    renderPagination();
    return;
  }

  countriesEl.innerHTML = pageItems
    .map((land, i) => {
      const globalIndex = start + i;
      const name = land.name ?? "Unbekannt";
      const flag = land.flag ?? "";
      const pop = land.population;
      const reg = land.region;
      const starActive = favoriten.has(name) ? "active" : "";
      const isCompared = compareNames.has(name) ? "compare-selected" : "";

      return `
        <article class="card ${isCompared}" data-idx="${globalIndex}">
          <button class="star ${starActive}" data-star title="Favorit umschalten">⭐</button>
          <img src="${flag}" alt="Flagge von ${name}" class="flag" loading="lazy" />
          <div class="name">${name}</div>
          <div class="muted small">
            ${reg ? `Region: ${reg}` : "Region: –"}
            ${typeof pop === "number" ? ` • Einwohner: ${fmt.format(pop)}` : ""}
          </div>
          <button class="compare-btn" data-compare>⚖ Vergleichen</button>
        </article>
      `;
    })
    .join("");

  setStatus(
    `${lastTotalItems} Länder gefunden (Seite ${currentPage} von ${totalPages})`
  );
  updateFavInfo();
  renderPagination();
  renderComparePanel();
}

// Steckbrief 
function openDetail(land) {
  if (!detailBox) return;

  const name = land.name ?? "Unbekannt";
  const flag = land.flag ?? "";

  detailFlag.src = flag;
  detailFlag.alt = "Flagge von " + name;
  detailName.textContent = name;
  detailIso2.textContent = land.iso2 || "–";
  detailIso3.textContent = land.iso3 || "–";
  detailRegion.textContent = land.region || "–";
  detailSubregion.textContent = land.subregion || "–";
  detailCapital.textContent = land.capital || "–";
  detailArea.textContent =
    typeof land.area === "number" ? fmt.format(land.area) + " km²" : "–";
  detailPopulation.textContent =
    typeof land.population === "number" ? fmt.format(land.population) : "–";

  detailBox.classList.remove("hidden");
  detailBox.scrollIntoView({ behavior: "smooth", block: "center" });
}

function closeDetail() {
  detailBox && detailBox.classList.add("hidden");
}

detailClose && detailClose.addEventListener("click", closeDetail);
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeDetail();
});

// Vergleichsmodus
function toggleCompare(land) {
  const name = land.name;
  if (!name) return;

  if (compareNames.has(name)) {
    compareNames.delete(name);
  } else {
    if (compareNames.size >= 2) {
      // max 2
      setStatus("Maximal 2 Länder im Vergleich. Entferne zuerst eines.");
      return;
    }
    compareNames.add(name);
  }
  render();
}

function renderComparePanel() {
  if (!compareSection || !compareContent) return;

  if (compareNames.size === 0) {
    compareSection.classList.add("hidden");
    compareContent.innerHTML = "";
    return;
  }

  compareSection.classList.remove("hidden");

  const items = Array.from(compareNames).map(name =>
    alleLaender.find(l => l.name === name)
  ).filter(Boolean);

  compareContent.innerHTML = items
    .map(land => {
      const pop = typeof land.population === "number" ? fmt.format(land.population) : "–";
      const area = typeof land.area === "number" ? fmt.format(land.area) + " km²" : "–";
      const capital = land.capital || "–";
      const region = land.region || "–";

      return `
        <div class="compare-card">
          <h3>${land.name}</h3>
          <p><strong>Region:</strong> ${region}</p>
          <p><strong>Hauptstadt:</strong> ${capital}</p>
          <p><strong>Einwohner:</strong> ${pop}</p>
          <p><strong>Fläche:</strong> ${area}</p>
        </div>
      `;
    })
    .join("");

  if (compareNames.size === 1) {
    compareInfo.textContent = "Ein Land ausgewählt. Wähle noch ein zweites für den Vergleich.";
  } else if (compareNames.size === 2) {
    compareInfo.textContent = "Zwei Länder im Vergleich (Einwohner & mehr).";
  }
}

compareClear &&
  compareClear.addEventListener("click", () => {
    compareNames.clear();
    render();
  });

//Klicks in Länderliste
countriesEl.addEventListener("click", e => {
  const card = e.target.closest(".card");
  if (!card) return;

  const idx = Number(card.dataset.idx);
  const land = gefilterteLaender[idx];

  // Favorit
  if (e.target.closest("[data-star]")) {
    const name = land.name;
    if (favoriten.has(name)) favoriten.delete(name);
    else favoriten.add(name);
    saveFavs();
    render();
    return;
  }

  // Vergleich-Button
  if (e.target.closest("[data-compare]")) {
    toggleCompare(land);
    return;
  }

  // Sonst Detail öffnen
  openDetail(land);
});

// Live-Vorschläge
function updateSuggestions() {
  if (!suggestionsEl || !searchInput) return;

  const q = searchInput.value.trim().toLowerCase();
  if (!q) {
    suggestionsEl.innerHTML = "";
    suggestionsEl.classList.remove("show");
    return;
  }

  const matches = alleLaender
    .filter(l => (l.name || "").toLowerCase().startsWith(q))
    .slice(0, 7);

  if (!matches.length) {
    suggestionsEl.innerHTML = "";
    suggestionsEl.classList.remove("show");
    return;
  }

  suggestionsEl.innerHTML = matches
    .map(l => `<button type="button" data-name="${l.name}">${l.name}</button>`)
    .join("");

  suggestionsEl.classList.add("show");
}

suggestionsEl &&
  suggestionsEl.addEventListener("click", e => {
    const btn = e.target.closest("button[data-name]");
    if (!btn) return;
    const name = btn.dataset.name;
    const land = alleLaender.find(l => l.name === name);
    if (!land) return;

    searchInput.value = name;
    nurFavoriten = false;
    if (onlyFavCb) onlyFavCb.checked = false;
    currentPage = 1;
    render();
    openDetail(land);

    suggestionsEl.innerHTML = "";
    suggestionsEl.classList.remove("show");
  });

document.addEventListener("click", e => {
  if (!suggestionsEl) return;
  if (
    e.target === searchInput ||
    e.target === suggestionsEl ||
    suggestionsEl.contains(e.target)
  ) {
    return;
  }
  suggestionsEl.innerHTML = "";
  suggestionsEl.classList.remove("show");
});

// Nach oben 
if (toTopBtn) {
  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
      toTopBtn.classList.add("show");
    } else {
      toTopBtn.classList.remove("show");
    }
  });

  toTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// Events
searchBtn &&
  searchBtn.addEventListener("click", () => {
    currentPage = 1;
    render();
    updateSuggestions();
  });

searchInput &&
  searchInput.addEventListener("input", () => {
    currentPage = 1;
    render();
    updateSuggestions();
  });

sortSelect &&
  sortSelect.addEventListener("change", () => {
    currentPage = 1;
    render();
  });

regionSelect &&
  regionSelect.addEventListener("change", () => {
    currentPage = 1;
    render();
  });

onlyFavCb &&
  onlyFavCb.addEventListener("change", () => {
    currentPage = 1;
    render();
  });

resetBtn &&
  resetBtn.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    if (sortSelect) sortSelect.value = "";
    if (regionSelect) regionSelect.value = "";
    if (onlyFavCb) onlyFavCb.checked = false;
    nurFavoriten = false;
    currentPage = 1;
    compareNames.clear();
    render();
    closeDetail();
    updateSuggestions();
    setStatus(`${alleLaender.length} Länder geladen.`);
  });

// Alle Favoriten löschen
clearFavBtn &&
  clearFavBtn.addEventListener("click", () => {
    favoriten.clear();
    saveFavs();
    render();
    setStatus("Alle Favoriten wurden gelöscht.");
  });

// Pagination Buttons
paginationEl &&
  paginationEl.addEventListener("click", e => {
    const btn = e.target.closest(".page-btn");
    if (!btn) return;

    if (btn.dataset.page === "prev" && currentPage > 1) {
      currentPage--;
      render();
    } else if (btn.dataset.page === "next" && currentPage < totalPages) {
      currentPage++;
      render();
    }
  });

// Nur-Favoriten-Ansicht toggeln
favViewBtn &&
  favViewBtn.addEventListener("click", () => {
    nurFavoriten = !nurFavoriten;
    favViewBtn.classList.toggle("active", nurFavoriten);
    currentPage = 1;
    render();
  });

// Dark-Mode 
darkToggle &&
  darkToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem(
      themeKey,
      document.body.classList.contains("dark") ? "1" : "0"
    );
    updateDarkIcon();
  });

//Start 
ladeLaender();
