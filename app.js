
let alleLaender = [];
    let gefilterteLaender = [];

    const countriesEl = document.getElementById("countries");
    const statusEl = document.getElementById("status");
    const searchInput = document.getElementById("searchInput");
    const searchBtn = document.getElementById("searchBtn");
    const regionSelect = document.getElementById("regionSelect");
    const sortSelect = document.getElementById("sortSelect");
    const resetBtn = document.getElementById("resetBtn");

    async function ladeLaender() {
      setStatus("Lade Länder…");
      try {
        const res = await fetch("https://countriesnow.space/api/v0.1/countries/flag/images");
        if (!res.ok) throw new Error("API-Antwort war nicht ok");

        const json = await res.json();
        const data = json.data;

        alleLaender = data.sort((a, b) =>
          (a.name || "").localeCompare(b.name || "")
        );
        gefilterteLaender = alleLaender;

        renderLaender(gefilterteLaender);
        setStatus(gefilterteLaender.length + " Länder geladen.");
      } catch (err) {
        console.error("Fehler beim API-Call:", err);
        setStatus("Fehler beim Laden der Länder 😢");
      }
    }

    function renderLaender(liste) {
      if (!liste || liste.length === 0) {
        countriesEl.innerHTML = '<p class="muted">Keine Länder gefunden.</p>';
        return;
      }

      countriesEl.innerHTML = liste.map((land) => {
        const name = land.name ?? "Unbekannt";
        const flag = land.flag ?? land.flag_url ?? "";
        return `
          <article class="card">
            <img src="${flag}" alt="Flagge von ${name}" class="flag" loading="lazy" />
            <div class="name">${name}</div>
          </article>
        `;
      }).join("");
    }

    function filterLaender() {
      const suchbegriff = searchInput.value.trim().toLowerCase();
      const region = regionSelect.value; // nur Demo

      let tmp = alleLaender;

      if (suchbegriff) {
        tmp = tmp.filter((l) =>
          (l.name || "").toLowerCase().includes(suchbegriff)
        );
      }

      // Demo-Region: Europa = Länder A–M, Asien = N–Z
      if (region) {
        if (region === "Europe") {
          tmp = tmp.filter((l) => (l.name || "").charAt(0).toUpperCase() <= "M");
        } else if (region === "Asia") {
          tmp = tmp.filter((l) => (l.name || "").charAt(0).toUpperCase() > "M");
        }
      }

      const sort = sortSelect.value;
      if (sort) {
        tmp = sortiereLaender(tmp, sort);
      }

      gefilterteLaender = tmp;
      renderLaender(gefilterteLaender);
      setStatus(gefilterteLaender.length + " Länder gefunden.");
    }

    function sortiereLaender(liste, mode) {
      const kopie = [...liste];
      switch (mode) {
        case "name-asc":
          return kopie.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        case "name-desc":
          return kopie.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
        default:
          return liste;
      }
    }

    function setStatus(msg) {
      if (statusEl) statusEl.textContent = msg;
    }

    searchBtn?.addEventListener("click", filterLaender);
    searchInput?.addEventListener("input", filterLaender);
    regionSelect?.addEventListener("change", filterLaender);
    sortSelect?.addEventListener("change", filterLaender);
    resetBtn?.addEventListener("click", () => {
      searchInput.value = "";
      regionSelect.value = "";
      sortSelect.value = "";
      gefilterteLaender = alleLaender;
      renderLaender(alleLaender);
      setStatus(alleLaender.length + " Länder geladen.");
    });

    ladeLaender();
