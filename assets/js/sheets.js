
document.addEventListener("DOMContentLoaded", () => {

  const sheetURL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTGEGjryoMoYyFZIWPFrYLLO9M9Z0zq0lbIB4xIe-_-VqRwAQ6KP2ley9HpuDokO9i07lbDD4CnKqVT/pub?gid=0&single=true&output=csv";

  fetch(sheetURL)
    .then(res => res.text())
    .then(csv => {

      // ✅ 1. Convert CSV → objects
      const data = csvToObjects(csv);

      // ✅ 2. Store data for searching
      let tableData = data;

      // ✅ 3. Grab DOM elements
      const tbody = document.querySelector("#crafting-table tbody");
      const searchInput = document.getElementById("search");

      // ✅ 4. Initial render
      renderTable(tableData);

      // ✅ 5. Live search
      searchInput.addEventListener("input", () => {
        const query = searchInput.value.toLowerCase();

        const filtered = tableData.filter(item =>
          Object.values(item).some(value =>
            value.toLowerCase().includes(query)
          )
        );

        renderTable(filtered);
      });

      // ---------- FUNCTIONS ----------

      function renderTable(rows) {
        tbody.innerHTML = "";

        rows.forEach(item => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${item.name}</td>
            <td>${item.materials}</td>
            <td>${item.crafting_time}</td>
            <td>${item.checks}</td>
            <td>${item.difficulty}</td>
            <td>${item.rarity}</td>
            <td>${item.value_gp}</td>
          `;
          tbody.appendChild(tr);
        });
      }
    })
    .catch(err => console.error("FETCH ERROR:", err));

  // ---------- CSV HELPERS ----------

  function normalizeHeader(header) {
    return header
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^\w]/g, "");
  }

  function csvToObjects(csv) {
    const lines = csv.trim().split("\n");
    const rawHeaders = lines.shift().split(",");
    const headers = rawHeaders.map(normalizeHeader);

    return lines.map(line => {
      const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
      return headers.reduce((obj, header, i) => {
        obj[header] = values[i]?.replace(/"/g, "").trim() || "";
        return obj;
      }, {});
    });
  }

});
