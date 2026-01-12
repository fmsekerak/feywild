const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTGEGjryoMoYyFZIWPFrYLLO9M9Z0zq0lbIB4xIe-_-VqRwAQ6KP2ley9HpuDokO9i07lbDD4CnKqVT/pub?gid=0&single=true&output=csv";

fetch(sheetURL)
  .then(res => res.text())
  .then(csv => {
    const data = csvToObjects(csv);
    console.log("DATA:", data);

    const list = document.getElementById("items");

    data.forEach(item => {
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${item.name}</strong><br>
        Materials: ${item.materials}<br>
        Crafting Time: ${item.crafting_time}<br>
        Checks: ${item.checks}<br>
        Difficulty: ${item.difficulty}<br>
        Rarity: ${item.rarity}<br>
        Value: ${item.value}
      `;
      list.appendChild(li);
    });
  })
  .catch(err => console.error("FETCH ERROR:", err));

/* ---------------- HELPERS ---------------- */

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