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
      const itemProfession = (item.profession || "").trim().toLowerCase();
      const matchesProfession = !selectedProfession || itemProfession === selectedProfession;

      return matchesSearch && matchesProfession;
    });

    renderCraftingItems(filtered);
  }

  function populateProfessionDropdown(data) {
    if (!professionFilter) return;

    // Get unique, non-empty profession names from data
    const professions = [...new Set(
      data.map(item => (item.profession || "").trim()).filter(Boolean)
    )].sort();

    // Preserve the default "All Professions" option and append unique professions
    professionFilter.innerHTML = `<option value="">All Professions</option>`;
    professions.forEach(prof => {
      const option = document.createElement("option");
      option.value = prof;
      option.textContent = prof;
      professionFilter.appendChild(option);
    });
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

      const name = item.name || item.item_name || "Unnamed Item";
      const materials = item.materials || item.crafting_materials || "—";
      const time = item.crafting_time || item.time || "—";
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
    if (!text || text === "—") return "—";
    return text.replace(/\n/g, "<br>");
  }
});