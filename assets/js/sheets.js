document.addEventListener("DOMContentLoaded", () => {
  const sheetURL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTGEGjryoMoYyFZIWPFrYLLO9M9Z0zq0lbIB4xIe-_-VqRwAQ6KP2ley9HpuDokO9i07lbDD4CnKqVT/pub?gid=1358917249&single=true&output=csv";

  const container = document.getElementById("crafting-list");
  const searchInput = document.getElementById("search");
  const professionFilter = document.getElementById("profession-filter");

  if (!container) return;

  let tableData = [];

  Papa.parse(sheetURL, {
    download: true,
    header: true,
    skipEmptyLines: "greedy",
    complete: function (results) {
      if (!results.data || results.data.length === 0) {
        container.innerHTML = `<p style="color:#ffb3ff; text-align:center;">No data found in sheet.</p>`;
        return;
      }

      // Clean headers for every item
      tableData = results.data.map(row => {
        const cleanedRow = {};
        for (let key in row) {
          cleanedRow[normalizeHeader(key)] = row[key] ? String(row[key]).trim() : "";
        }
        return cleanedRow;
      });

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
      console.error("PapaParse error:", err);
    }
  });

  // ---------- SAFE FILTERING ----------

  function applyFilters() {
    const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const selectedProf = professionFilter ? professionFilter.value.trim().toLowerCase() : "";

    const filtered = tableData.filter(item => {
      // 1. Check search text against all property values
      const matchesSearch = !query || Object.values(item).some(val =>
        val.toLowerCase().includes(query)
      );

      // 2. Check profession dropdown match (supports 'profession' or 'professions')
      const itemProf = (item.profession || item.professions || "").toLowerCase();
      const matchesProf = !selectedProf || itemProf === selectedProf;

      return matchesSearch && matchesProf;
    });

    renderCraftingItems(filtered);
  }

  // ---------- POPULATE DROPDOWN ----------

  function populateProfessionDropdown(data) {
    if (!professionFilter) return;

    const professionSet = new Set();

    data.forEach(item => {
      const prof = item.profession || item.professions || "";
      if (prof && prof !== "—") {
        professionSet.add(prof);
      }
    });

    const sortedProfessions = Array.from(professionSet).sort();

    professionFilter.innerHTML = `<option value="">All Professions</option>`;
    sortedProfessions.forEach(prof => {
      const option = document.createElement("option");
      option.value = prof;
      option.textContent = prof;
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
      const profession = item.profession || item.professions || "—";
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
    if (!text || text === "—") return "—";
    return text.replace(/\n/g, "<br>");
  }
});