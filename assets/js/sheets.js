// Remove DOMContentLoaded wrapper to test direct execution
(function initCraftingSearch() {
  console.log("sheets.js loaded successfully.");

  const sheetURL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTGEGjryoMoYyFZIWPFrYLLO9M9Z0zq0lbIB4xIe-_-VqRwAQ6KP2ley9HpuDokO9i07lbDD4CnKqVT/pub?gid=1358917249&single=true&output=csv";

  // Immediate visual indicator while fetching
  const container = document.getElementById("crafting-list");
  const searchInput = document.getElementById("search");
  const professionFilter = document.getElementById("profession-filter");

  if (!container) return;
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
  const rows = parseCSVRows(csv);
  if (rows.length === 0) return [];

  const rawHeaders = rows.shift();
  const headers = rawHeaders.map(normalizeHeader);

  return rows.map(row => {
    return headers.reduce((obj, header, i) => {
      obj[header] = row[i] !== undefined ? row[i].trim() : "";
      return obj;
    }, {});
  });
}

function parseCSVRows(text) {
  const rows = [];
  let currentRow = [];
  let currentToken = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Handle escaped quotes ("") inside quoted fields
        currentToken += '"';
        i++;
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      // Comma outside quotes = end of field
      currentRow.push(currentToken);
      currentToken = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      // Newline outside quotes = end of row
      if (char === '\r' && nextChar === '\n') {
        i++; // Skip \n in \r\n
      }
      currentRow.push(currentToken);
      if (currentRow.some(field => field.trim() !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentToken = '';
    } else {
      currentToken += char;
    }
  }

  // Push remaining token/row if file doesn't end with a newline
  if (currentToken || currentRow.length > 0) {
    currentRow.push(currentToken);
    if (currentRow.some(field => field.trim() !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

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

function populateProfessionDropdown(data) {
  if (!professionFilter) return;

  const professionSet = new Set();

  data.forEach(item => {
    // Search dynamically for any key containing "prof" (e.g. profession, professions, profession_type)
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
    // Ensure option value is trimmed to prevent whitespace mismatches
    option.value = prof.trim();
    option.textContent = prof.trim();
    professionFilter.appendChild(option);
  });
}

// Updated applyFilters function to ensure exact matching between dropdown and items
function applyFilters() {
  const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
  const selectedProf = professionFilter ? professionFilter.value.trim().toLowerCase() : "";

  const filtered = tableData.filter(item => {
    // Text search query matching across all item properties
    const matchesSearch = !query || Object.values(item).some(val =>
      String(val).toLowerCase().includes(query)
    );

    // Dynamic profession matching
    const profKey = Object.keys(item).find(key => key.includes("prof"));
    const itemProf = profKey && item[profKey] ? String(item[profKey]).trim().toLowerCase() : "";

    const matchesProf = !selectedProf || itemProf === selectedProf;

    return matchesSearch && matchesProf;
  });

  renderCraftingItems(filtered);
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
          <div class="detail-row"><span class="detail-label">Materials:</span><br> ${materials.replace(/\n/g, '<br>')}</div>
          <div class="detail-row"><span class="detail-label">Crafting Time:</span> ${time}</div>
          <div class="detail-row"><span class="detail-label">Rarity:</span> ${rarity}</div>
          <div class="detail-row"><span class="detail-label">Profession:</span> ${profession}</div>
          <div class="detail-row detail-description">
            <span class="detail-label">Description:</span><br>${description.replace(/\n/g, '<br>')}
          </div>
        </div>
      `;

      const header = itemElement.querySelector(".crafting-item-header");

      const toggleOpen = (e) => {
        e.preventDefault();
        itemElement.classList.toggle("open");
      };

      // Handle both mouse clicks and mobile touch taps without double-firing
      header.addEventListener("click", toggleOpen);
      container.appendChild(itemElement);
    });
  }
})();