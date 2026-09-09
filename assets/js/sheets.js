document.addEventListener("DOMContentLoaded", () => {
  // Correct published CSV endpoint (does not require login)
  const rawSheetURL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTGEGjryoMoYyFZIWPFrYLLO9M9Z0zq0lbIB4xIe-_-VqRwAQ6KP2ley9HpuDokO9i07lbDD4CnKqVT/pub?output=csv";

  // Use AllOrigins proxy to bypass browser file:/// and CORS locks
  const proxyURL = "https://api.allorigins.win/raw?url=" + encodeURIComponent(rawSheetURL);

  const container = document.getElementById("crafting-list");
  const searchInput = document.getElementById("search");
  const professionFilter = document.getElementById("profession-filter");

  if (!container) return;

  container.innerHTML = `<p style="color:#fad9e9; text-align:center;">Loading crafting recipes...</p>`;

  let tableData = [];

  // Attempt fetch via Proxy first
  fetch(proxyURL)
    .then(res => {
      if (!res.ok) throw new Error("HTTP Status " + res.status);
      return res.text();
    })
    .then(csvText => parseCSV(csvText))
    .catch(err => {
      console.warn("Proxy fetch failed. Attempting direct PapaParse...", err);
      // Fallback to direct PapaParse download
      Papa.parse(rawSheetURL, {
        download: true,
        header: true,
        skipEmptyLines: "greedy",
        complete: function (results) {
          if (results.data && results.data.length > 0) {
            processData(results.data);
          } else {
            console.error("No data returned from sheet.");
          }
        },
        error: function (pErr) {
          console.error("PapaParse direct failed:", pErr);
        }
      });
    });

  function parseCSV(csvText) {
    const cleanCsv = csvText.replace(/^\uFEFF/, "");
    Papa.parse(cleanCsv, {
      header: true,
      skipEmptyLines: "greedy",
      complete: function (results) {
        if (results.data && results.data.length > 0) {
          processData(results.data);
        }
      }
    });
  }

  function processData(data) {
    tableData = data.map(row => {
      const cleaned = {};
      for (let key in row) {
        cleaned[normalizeHeader(key)] = row[key] ? String(row[key]) : "";
      }
      return cleaned;
    });

    console.log("SUCCESSFULLY PARSED DATA:", tableData);

    populateProfessionDropdown(tableData);
    renderCraftingItems(tableData);

    if (searchInput) searchInput.addEventListener("input", applyFilters);
    if (professionFilter) professionFilter.addEventListener("change", applyFilters);
  }

  // ---------- FILTER LOGIC ----------

  function applyFilters() {
    const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const selectedProfession = professionFilter ? professionFilter.value.toLowerCase() : "";

    const filtered = tableData.filter(item => {
      const matchesSearch = !query || Object.values(item).some(val =>
        String(val).toLowerCase().includes(query)
      );

      const itemProf = (item.profession || "").trim().toLowerCase();
      const matchesProfession = !selectedProfession || itemProf === selectedProfession;

      return matchesSearch && matchesProfession;
    });

    renderCraftingItems(filtered);
  }

  function populateProfessionDropdown(data) {
    if (!professionFilter) return;

    const professionSet = new Set();
    data.forEach(item => {
      const prof = (item.profession || "").trim();
      if (prof && prof !== "—" && prof !== "undefined") {
        professionSet.add(prof);
      }
    });

    const professions = Array.from(professionSet).sort();

    professionFilter.innerHTML = `<option value="">All Professions</option>`;
    professions.forEach(prof => {
      const option = document.createElement("option");
      option.value = prof;
      option.textContent = prof;
      professionFilter.appendChild(option);
    });
  }

  function normalizeHeader(header) {
    return header
      .replace(/^\uFEFF/, "")
      .replace(/\u00A0/g, " ")
      .trim()
      .toLowerCase()
      .replace(/\(.*?\)/g, "")
      .replace(/\s+/g, "_")
      .replace(/[^\w]/g, "");
  }

  function renderCraftingItems(data) {
    container.innerHTML = "";

    if (!data || data.length === 0) {
      container.innerHTML = `<p style="color:#fad9e9; text-align:center;">No crafting items found.</p>`;
      return;
    }

    data.forEach(item => {
      const itemElement = document.createElement("div");
      itemElement.className = "crafting-item";

      const name = item.name || "Unnamed Item";
      const materials = item.materials || "—";
      const time = item.crafting_time || "—";
      const rarity = item.rarity || "—";
      const profession = item.profession || "—";
      const description = item.description || "—";

      itemElement.innerHTML = `
        <div class="crafting-item-header">
          <span class="item-name">${name}</span>
        </div>
        <div class="crafting-item-body">
          <div class="detail-row detail-block">
            <span class="detail-label">Materials:</span><br>${formatMultiline(materials)}
          </div>
          <div class="detail-row"><span class="detail-label">Crafting Time:</span> ${time}</div>
          <div class="detail-row"><span class="detail-label">Rarity:</span> ${rarity}</div>
          <div class="detail-row"><span class="detail-label">Profession:</span> ${profession}</div>
          <div class="detail-row detail-description">
            <span class="detail-label">Description:</span><br>${formatMultiline(description)}
          </div>
        </div>
      `;

      const header = itemElement.querySelector(".crafting-item-header");
      header.addEventListener("click", () => {
        itemElement.classList.toggle("open");
      });

      container.appendChild(itemElement);
    });
  }

  function formatMultiline(text) {
    if (!text || text === "—" || text === "undefined") return "—";
    return text.replace(/\n/g, "<br>");
  }
});