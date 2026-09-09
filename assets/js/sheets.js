(function initCraftingSearch() {
  console.log("sheets.js initialized.");

  const sheetURL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTGEGjryoMoYyFZIWPFrYLLO9M9Z0zq0lbIB4xIe-_-VqRwAQ6KP2ley9HpuDokO9i07lbDD4CnKqVT/pub?gid=1358917249&single=true&output=csv";

  const container = document.getElementById("crafting-list");
  const searchInput = document.getElementById("search");
  const professionFilter = document.getElementById("profession-filter");

  if (!container) return;

  let tableData = [];

  // Single, reliable CSV parse & load
  Papa.parse(sheetURL, {
    download: true,
    header: true,
    skipEmptyLines: "greedy",
    complete: function (results) {
      if (!results.data || results.data.length === 0) {
        container.innerHTML = `<p style="color:#ffb3ff; text-align:center;">No data found in sheet.</p>`;
        return;
      }

      // Clean headers and normalize string values for every item
      tableData = results.data.map(row => {
        const cleanedRow = {};
        for (let key in row) {
          cleanedRow[normalizeHeader(key)] = row[key] ? String(row[key]).trim() : "";
        }
        return cleanedRow;
      });

      console.log("Parsed Table Data:", tableData);

      // Populate dropdown & initial render
      populateProfessionDropdown(tableData);
      renderCraftingItems(tableData);

      // Add filter event listeners
      if (searchInput) {
        searchInput.addEventListener("input", applyFilters);
      }
      if (professionFilter) {
        professionFilter.addEventListener("change", applyFilters);
      }
    },
    error: function (err) {
      console.error("PapaParse Error:", err);
      if (container) {
        container.innerHTML = `<p style="color:#ffb3ff; text-align:center;">Failed to fetch data from Google Sheets.</p>`;
      }
    }
  });

  // ---------- FILTER LOGIC ----------

  function applyFilters() {
    const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const selectedProf = professionFilter ? professionFilter.value.trim().toLowerCase() : "";

    const filtered = tableData.filter(item => {
      // 1. Text search matching across all properties
      const matchesSearch = !query || Object.values(item).some(val =>
        String(val).toLowerCase().includes(query)
      );

      // 2. Profession matching (fuzzy key search for "prof")
      const profKey = Object.keys(item).find(key => key.includes("prof"));
      const itemProf = profKey && item[profKey] ? String(item[profKey]).trim().toLowerCase() : "";

      const matchesProf = !selectedProf || itemProf === selectedProf;

      return matchesSearch && matchesProf;
    });

    renderCraftingItems(filtered);
  }

  // ---------- DROPDOWN BUILDER ----------

  function populateProfessionDropdown(data) {
    if (!professionFilter) return;

    const professionSet = new Set();

    data.forEach(item => {
      const profKey = Object.keys(item).find(key => key.includes("prof"));
      const prof = profKey && item[profKey] ? String(item[profKey]).trim() : "";

      if (prof && prof !== "—" && prof.toLowerCase() !== "undefined") {
        professionSet.add(prof);
      }
    });

    const sortedProfessions = Array.from(professionSet).sort((a, b) => 
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    );

    professionFilter.innerHTML = `<option value="">All Professions</option>`;
    
    sortedProfessions.forEach(prof => {
      const option = document.createElement("option");
      option.value = prof.trim();
      option.textContent = prof.trim();
      professionFilter.appendChild(option);
    });
  }

  // ---------- HELPER & RENDER FUNCTIONS ----------

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

      const name = item.name || item.item_name || "Unnamed Item";
      const materials = item.materials || item.crafting_materials || "—";
      const time = item.crafting_time || item.time || "—";
      const rarity = item.rarity || "—";
      
      const profKey = Object.keys(item).find(key => key.includes("prof"));
      const profession = profKey && item[profKey] ? item[profKey] : "—";
      
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
      header.addEventListener("click", (e) => {
        e.preventDefault();
        itemElement.classList.toggle("open");
      });

      container.appendChild(itemElement);
    });
  }

  function formatMultiline(text) {
    if (!text || text === "—" || text === "undefined") return "—";
    return text.replace(/\n/g, "<br>");
  }
})();