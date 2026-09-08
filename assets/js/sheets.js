document.addEventListener("DOMContentLoaded", () => {
  const rawSheetURL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTGEGjryoMoYyFZIWPFrYLLO9M9Z0zq0lbIB4xIe-_-VqRwAQ6KP2ley9HpuDokO9i07lbDD4CnKqVT/pub?gid=1358917249&single=true&output=csv";

  // Bypass CORS/Redirect issues on Google Sheets CSV URLs
  const sheetURL = "https://corsproxy.io/?" + encodeURIComponent(rawSheetURL);

  let tableData = [];

  fetch(sheetURL)
    .then(res => {
      if (!res.ok) throw new Error("HTTP Error " + res.status);
      return res.text();
    })
    .then(csv => {
      tableData = csvToObjects(csv);
      console.log("Loaded CSV Items:", tableData);

      const searchInput = document.getElementById("search");
      if (!searchInput) return;

      // Search filter listener
      searchInput.addEventListener("input", () => {
        const query = searchInput.value.trim().toLowerCase();

        if (!query) {
          const container = document.getElementById("crafting-list");
          if (container) container.innerHTML = "";
          return;
        }

        const filtered = tableData.filter(item =>
          Object.values(item).some(value =>
            String(value).toLowerCase().includes(query)
          )
        );

        renderCraftingItems(filtered);
      });
    })
    .catch(err => {
      console.error("FETCH ERROR:", err);
      // Fallback direct attempt if proxy fails
      fetch(rawSheetURL)
        .then(res => res.text())
        .then(csv => {
          tableData = csvToObjects(csv);
        })
        .catch(e => console.error("DIRECT FETCH ALSO FAILED:", e));
    });

  // ---------- CSV PARSING ----------

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

  // ---------- ACCORDION RENDER ----------

  function renderCraftingItems(data) {
    const container = document.getElementById("crafting-list");
    if (!container) return;

    container.innerHTML = "";

    if (data.length === 0) {
      container.innerHTML = `<p style="padding: 1rem; color: #777;">No matching items found.</p>`;
      return;
    }

    data.forEach(item => {
      const itemElement = document.createElement("div");
      itemElement.className = "crafting-item";

      // Flexible property lookup in case header names vary
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
          <div class="detail-row"><span class="detail-label">Materials:</span> ${formatMultiline(materials)}</div>
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