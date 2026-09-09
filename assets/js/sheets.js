document.addEventListener("DOMContentLoaded", () => {
  const sheetURL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTGEGjryoMoYyFZIWPFrYLLO9M9Z0zq0lbIB4xIe-_-VqRwAQ6KP2ley9HpuDokO9i07lbDD4CnKqVT/pub?gid=1358917249&single=true&output=csv";

  const container = document.getElementById("crafting-list");
  const searchInput = document.getElementById("search");
  const professionFilter = document.getElementById("profession-filter");

  if (!container) return;

  container.innerHTML = `<p style="color:#fad9e9; text-align:center;">Loading crafting recipes...</p>`;

  let tableData = [];

  Papa.parse(sheetURL, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      tableData = results.data.map(row => {
        const cleanedRow = {};
        for (let key in row) {
          cleanedRow[normalizeHeader(key)] = row[key];
        }
        return cleanedRow;
      });

      console.log("Loaded Table Data:", tableData);

      // Populate dropdown options automatically from the sheet data
      populateProfessionDropdown(tableData);

      // Initial render
      renderCraftingItems(tableData);

      // Attach event listeners for combined filtering
      if (searchInput) searchInput.addEventListener("input", applyFilters);
      if (professionFilter) professionFilter.addEventListener("change", applyFilters);
    },
    error: function (err) {
      console.error("PapaParse Error:", err);
      container.innerHTML = `<p style="color:#ffb3ff; text-align:center;">Failed to load Google Sheets data.</p>`;
    }
  });

  // ---------- FILTER LOGIC ----------

  function applyFilters() {
    const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const selectedProfession = professionFilter ? professionFilter.value.toLowerCase() : "";

    const filtered = tableData.filter(item => {
      // Check if text search query matches any field
      const matchesSearch = !query || Object.values(item).some(val =>
        String(val).toLowerCase().includes(query)
      );

      // Check if item's profession matches selected dropdown value
      const itemProfession = getFieldValue(item, ["profession"]).toLowerCase();
      const matchesProfession = !selectedProfession || itemProfession === selectedProfession;

      return matchesSearch && matchesProfession;
    });

    renderCraftingItems(filtered);
  }

  function populateProfessionDropdown(data) {
    if (!professionFilter) return;

    // Collect all unique profession strings
    const professionSet = new Set();

    data.forEach(item => {
      const prof = getFieldValue(item, ["profession"]);
      if (prof && prof !== "—") {
        professionSet.add(prof);
      }
    });

    const professions = Array.from(professionSet).sort();

    // Reset dropdown and add options
    professionFilter.innerHTML = `<option value="">All Professions</option>`;
    professions.forEach(prof => {
      const option = document.createElement("option");
      option.value = prof;
      option.textContent = prof;
      professionFilter.appendChild(option);
    });
  }

  // Helper to safely get field values across normalize header variants
  function getFieldValue(item, targetKeys) {
    for (let key of targetKeys) {
      if (item[key]) return item[key].trim();
    }
    return "—";
  }

  // ---------- HEADER HELPER ----------

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

  // ---------- RENDER FUNCTION ----------

  function renderCraftingItems(data) {
    container.innerHTML = "";

    if (!data || data.length === 0) {
      container.innerHTML = `<p style="color:#fad9e9; text-align:center;">No crafting items found.</p>`;
      return;
    }

    data.forEach(item => {
      const itemElement = document.createElement("div");
      itemElement.className = "crafting-item";

      const name = getFieldValue(item, ["name", "item_name"]);
      const materials = getFieldValue(item, ["materials", "crafting_materials"]);
      const time = getFieldValue(item, ["crafting_time", "time"]);
      const rarity = getFieldValue(item, ["rarity"]);
      const profession = getFieldValue(item, ["profession"]);
      const description = getFieldValue(item, ["description"]);

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