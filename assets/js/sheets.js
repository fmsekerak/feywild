// Remove DOMContentLoaded wrapper to test direct execution
(function initCraftingSearch() {
  console.log("sheets.js loaded successfully.");

  const sheetURL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTGEGjryoMoYyFZIWPFrYLLO9M9Z0zq0lbIB4xIe-_-VqRwAQ6KP2ley9HpuDokO9i07lbDD4CnKqVT/pub?gid=1358917249&single=true&output=csv";

  // Immediate visual indicator while fetching
  const container = document.getElementById("crafting-list");
  if (container) {
    container.innerHTML = `<p style="color:#fad9e9; text-align:center;">Loading crafting recipes...</p>`;
  } else {
    console.error("CRITICAL: Element with id='crafting-list' not found on DOM!");
    return;
  }

  let tableData = [];

  fetch(sheetURL)
    .then(res => {
      console.log("Fetch response status:", res.status);
      if (!res.ok) throw new Error("HTTP Status " + res.status);
      return res.text();
    })
    .then(csv => {
      console.log("Raw CSV character length:", csv.length);
      tableData = csvToObjects(csv);
      console.log("Parsed objects count:", tableData.length);

      // Render items on load
      renderCraftingItems(tableData);

      const searchInput = document.getElementById("search");
      if (searchInput) {
        searchInput.addEventListener("input", () => {
          const query = searchInput.value.trim().toLowerCase();
          if (!query) {
            renderCraftingItems(tableData);
            return;
          }
          const filtered = tableData.filter(item =>
            Object.values(item).some(val =>
              String(val).toLowerCase().includes(query)
            )
          );
          renderCraftingItems(filtered);
        });
      }
    })
    .catch(err => {
      console.error("SHEET FETCH FAILED:", err);
      if (container) {
        container.innerHTML = `<p style="color:#ffb3ff; text-align:center;">Failed to fetch data from Google Sheets. Check console for details.</p>`;
      }
    });

  // ---------- CSV PARSER ----------

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

  function csvToObjects(csv) {
    const lines = csv.split(/\r?\n/).filter(line => line.trim() !== "");
    if (lines.length === 0) return [];

    const rawHeaders = splitCSVRow(lines.shift());
    const headers = rawHeaders.map(normalizeHeader);

    return lines.map(line => {
      const values = splitCSVRow(line);
      return headers.reduce((obj, header, i) => {
        obj[header] = values[i] ? values[i].trim() : "";
        return obj;
      }, {});
    });
  }

  function splitCSVRow(row) {
    const result = [];
    let insideQuotes = false;
    let current = "";

    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        result.push(current.replace(/^"|"$/g, '').trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.replace(/^"|"$/g, '').trim());
    return result;
  }

  // ---------- RENDER FUNCTION ----------

  function renderCraftingItems(data) {
    if (!container) return;
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
          <div class="detail-row"><span class="detail-label">Materials:</span> ${materials.replace(/\n/g, '<br>')}</div>
          <div class="detail-row"><span class="detail-label">Crafting Time:</span> ${time}</div>
          <div class="detail-row"><span class="detail-label">Rarity:</span> ${rarity}</div>
          <div class="detail-row"><span class="detail-label">Profession:</span> ${profession}</div>
          <div class="detail-row detail-description">
            <span class="detail-label">Description:</span><br>${description.replace(/\n/g, '<br>')}
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
})();