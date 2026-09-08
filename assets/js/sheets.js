document.addEventListener("DOMContentLoaded", () => {
  const sheetURL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTGEGjryoMoYyFZIWPFrYLLO9M9Z0zq0lbIB4xIe-_-VqRwAQ6KP2ley9HpuDokO9i07lbDD4CnKqVT/pub?gid=1358917249&single=true&output=csv";

  let tableData = [];

  fetch(sheetURL)
    .then(res => res.text())
    .then(csv => {
      tableData = csvToObjects(csv);
      console.log("DATA:", tableData);

      const searchInput = document.getElementById("search");

      // 🔍 Live search input handler
      searchInput.addEventListener("input", () => {
        const query = searchInput.value.trim().toLowerCase();

        // Clear list if search is empty
        if (!query) {
          const container = document.getElementById("crafting-list");
          if (container) container.innerHTML = "";
          return;
        }

        // Filter items where any field matches search term
        const filtered = tableData.filter(item =>
          Object.values(item).some(value =>
            String(value).toLowerCase().includes(query)
          )
        );

        renderCraftingItems(filtered);
      });
    })
    .catch(err => console.error("FETCH ERROR:", err));

  // ---------- CSV HELPERS ----------

  function normalizeHeader(header) {
    return header
      .replace(/^\uFEFF/, "")    // remove BOM
      .replace(/\u00A0/g, " ")   // normalize spaces
      .trim()
      .toLowerCase()
      .replace(/\(.*?\)/g, "")   // remove "(gp)" etc
      .replace(/\s+/g, "_")
      .replace(/[^\w]/g, "");
  }

  function csvToObjects(csv) {
    const rows = [];
    let current = "";
    let insideQuotes = false;

    for (let char of csv) {
      if (char === '"') insideQuotes = !insideQuotes;
      if (char === "\n" && !insideQuotes) {
        rows.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    rows.push(current);

    if (rows.length === 0 || !rows[0]) return [];

    const rawHeaders = rows.shift().split(",");
    const headers = rawHeaders.map(normalizeHeader);

    return rows.map(row => {
      const values = row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/gs) || [];
      return headers.reduce((obj, header, i) => {
        obj[header] = values[i]
          ?.replace(/^"|"$/g, "")
          .replace(/\r/g, "")
          .trim() || "";
        return obj;
      }, {});
    });
  }

  // ---------- RENDER LIST ITEMS ----------

  function renderCraftingItems(data) {
    const container = document.getElementById("crafting-list");
    if (!container) return;
    
    container.innerHTML = "";

    data.forEach(item => {
      const itemElement = document.createElement("div");
      itemElement.className = "crafting-item";

      itemElement.innerHTML = `
        <div class="crafting-item-header">
          <span class="item-name">${item.name || "Unnamed Item"}</span>
        </div>
        <div class="crafting-item-body">
          <div class="detail-row"><span class="detail-label">Materials:</span> ${formatMultiline(item.materials)}</div>
          <div class="detail-row"><span class="detail-label">Crafting Time:</span> ${item.crafting_time || "—"}</div>
          <div class="detail-row"><span class="detail-label">Rarity:</span> ${item.rarity || "—"}</div>
          <div class="detail-row"><span class="detail-label">Profession:</span> ${item.profession || "—"}</div>
          <div class="detail-row detail-description">
            <span class="detail-label">Description:</span><br>${formatMultiline(item.description)}
          </div>
        </div>
      `;

      // Click handler to toggle open/closed state
      const header = itemElement.querySelector(".crafting-item-header");
      header.addEventListener("click", () => {
        itemElement.classList.toggle("open");
      });

      container.appendChild(itemElement);
    });
  }

  function formatMultiline(text) {
    if (!text) return "—";
    return text.replace(/\n/g, "<br>");
  }
});