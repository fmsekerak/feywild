document.addEventListener("DOMContentLoaded", () => {
  const sheetURL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTGEGjryoMoYyFZIWPFrYLLO9M9Z0zq0lbIB4xIe-_-VqRwAQ6KP2ley9HpuDokO9i07lbDD4CnKqVT/pub?output=csv";

  const container = document.getElementById("crafting-list");
  const searchInput = document.getElementById("search");
  const professionFilter = document.getElementById("profession-filter");

  if (!container) return;

  container.innerHTML = `<p style="color:#fad9e9; text-align:center;">Loading crafting recipes...</p>`;

  let tableData = [];

  // 1. Try Direct Fetch First
  fetch(sheetURL)
    .then(res => {
      if (!res.ok) throw new Error("Direct fetch status " + res.status);
      return res.text();
    })
    .then(csvText => parseCSVString(csvText))
    .catch(directErr => {
      console.warn("Direct fetch failed, attempting via Proxy fallback...", directErr);
      
      // 2. Try CorsProxy Fallback
      const proxyURL = "https://corsproxy.io/?" + encodeURIComponent(sheetURL);
      fetch(proxyURL)
        .then(res => {
          if (!res.ok) throw new Error("Proxy fetch status " + res.status);
          return res.text();
        })
        .then(csvText => parseCSVString(csvText))
        .catch(proxyErr => {
          console.warn("Proxy fetch failed, attempting direct PapaParse download...", proxyErr);

          // 3. Last Resort: Let PapaParse download directly
          Papa.parse(sheetURL, {
            download: true,
            header: true,
            skipEmptyLines: "greedy",
            complete: function (results) {
              if (results.data && results.data.length > 0) {
                processParsedData(results.data);
              } else {
                showError("Google Sheet returned empty data.");
              }
            },
            error: function (err) {
              console.error("PapaParse direct download error:", err);
              showError("Failed to fetch Google Sheet. If testing locally, open with VS Code Live Server or host online.");
            }
          });
        });
    });

  // ---------- CSV PARSER ----------

  function parseCSVString(csvText) {
    const cleanCsv = csvText.replace(/^\uFEFF/, "");
    Papa.parse(cleanCsv, {
      header: true,
      skipEmptyLines: "greedy",
      complete: function (results) {
        if (results.data && results.data.length > 0) {
          processParsedData(results.data);
        } else {
          showError("Google Sheet returned empty data.");
        }
      },
      error: function (err) {
        console.error("PapaParse string parse error:", err);
        showError("Failed to parse CSV data.");
      }
    });
  }

  function processParsedData(data) {
    tableData = data.map(row => {
      const cleanedRow = {};
      for (let key in row) {
        cleanedRow[normalizeHeader(key)] = row[key] ? String(row[key]) : "";
      }
      return cleanedRow;
    });

    console.log("SUCCESSFULLY LOADED DATA:", tableData);

    populateProfessionDropdown(tableData);
    renderCraftingItems(tableData);

    if (searchInput) searchInput.addEventListener("input", applyFilters);
    if (professionFilter) professionFilter.addEventListener("change", applyFilters);
  }

  function showError(msg) {
    if (container) {
      container.innerHTML = `<p style="color:#ffb3ff; text-align:center;">${msg}</p>`;
    }
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