
document.addEventListener("DOMContentLoaded", () => {

  const sheetURL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTGEGjryoMoYyFZIWPFrYLLO9M9Z0zq0lbIB4xIe-_-VqRwAQ6KP2ley9HpuDokO9i07lbDD4CnKqVT/pubhtml?gid=1358917249&single=true";


  fetch(sheetURL)
    .then(res => res.text())
    .then(csv => {
      const data = csvToObjects(csv);
      console.log("DATA:", data);

      let tableData = data;

      const tbody = document.querySelector("#crafting-table tbody");
      const searchInput = document.getElementById("search");

      /* renderTable(tableData); */

      // 🔍 Live search
      searchInput.addEventListener("input", () => {
        const query = searchInput.value.trim().toLowerCase();

        // If search is empty → clear table
        if (!query) {
          tbody.innerHTML = "";
          return;
        }

        const filtered = tableData.filter(item =>
          Object.values(item).some(value =>
            value.toLowerCase().includes(query)
          )
        );

        renderTable(filtered);
      });


      // ---------- RENDER ----------

      function renderTable(rows) {
        tbody.innerHTML = "";

        rows.forEach(item => {
          const tr = document.createElement("tr");

          tr.innerHTML = `
            <td>${item.name}</td>
            <td>${formatMultiline(item.materials)}</td>
            <td>${item.crafting_time}</td>
            <td>${item.rarity}</td>
            <td>${item.profession}</td>
            <td>${item.description}</td>
          `;

          tbody.appendChild(tr);
        });
      }
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


});

  // ---------- MATERIALS FORMATTERS ----------

function formatMultiline(text) {
  if (!text) return "—";
  return text.replace(/\n/g, "<br>");
}
