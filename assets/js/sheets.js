const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTGEGjryoMoYyFZIWPFrYLLO9M9Z0zq0lbIB4xIe-_-VqRwAQ6KP2ley9HpuDokO9i07lbDD4CnKqVT/pub?gid=0&single=true&output=csv";

fetch(sheetURL)
  .then(res => res.text())
  .then(csv => {
    const data = csvToObjects(csv);
    console.log(data);
  });

const list = document.getElementById("items");

function csvToObjects(csv) {
  const lines = csv.trim().split("\n");
  const headers = lines.shift().split(",");

  return lines.map(line => {
    const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
    return headers.reduce((obj, header, i) => {
      obj[header] = values[i]?.replace(/"/g, "").trim();
      return obj;
    }, {});
  });
}

data.forEach(item => {
  const li = document.createElement("li");
  li.textContent = `${item.name} — ${item.price}gp (${item.rarity})`;
  list.appendChild(li);
});
