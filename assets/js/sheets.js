(() => {
  const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTGEGjryoMoYyFZIWPFrYLLO9M9Z0zq0lbIB4xIe-_-VqRwAQ6KP2ley9HpuDokO9i07lbDD4CnKqVT/pub?gid=1358917249&single=true&output=csv';
  const container = document.getElementById('crafting-list');
  const searchInput = document.getElementById('search');
  const professionFilter = document.getElementById('profession-filter');
  const status = document.getElementById('search-status');
  if (!container || !searchInput || !professionFilter) return;

  let items = [];
  const setStatus = message => { if (status) status.textContent = message; };
  setStatus('Loading crafting recipes…');

  function normalizeHeader(header) {
    return header.replace(/^\uFEFF/, '').replace(/\u00A0/g, ' ').trim()
      .toLowerCase().replace(/\(.*?\)/g, '').replace(/\s+/g, '_').replace(/[^\w]/g, '');
  }

  function parseCSVRows(csv) {
    const rows = [];
    let row = [], field = '', quoted = false;
    for (let i = 0; i < csv.length; i++) {
      const char = csv[i];
      if (char === '"') {
        if (quoted && csv[i + 1] === '"') { field += '"'; i++; }
        else quoted = !quoted;
      } else if (char === ',' && !quoted) {
        row.push(field); field = '';
      } else if ((char === '\r' || char === '\n') && !quoted) {
        if (char === '\r' && csv[i + 1] === '\n') i++;
        row.push(field);
        if (row.some(value => value.trim())) rows.push(row);
        row = []; field = '';
      } else field += char;
    }
    if (quoted) throw new Error('Unclosed quoted field in recipe data');
    if (field || row.length) {
      row.push(field);
      if (row.some(value => value.trim())) rows.push(row);
    }
    return rows;
  }

  function csvToObjects(csv) {
    const rows = parseCSVRows(csv);
    if (!rows.length) return [];
    const headers = rows.shift().map(normalizeHeader);
    return rows.map(row => Object.fromEntries(headers.map((key, i) => [key, (row[i] || '').trim()])));
  }

  function professionOf(item) {
    const key = Object.keys(item).find(name => ['profession', 'professions', 'profession_type'].includes(name));
    return key ? item[key] : '';
  }

  function populateProfessions() {
    const names = [...new Set(items.map(professionOf).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    professionFilter.replaceChildren(new Option('All Professions', ''),
      ...names.map(name => new Option(name, name)));
  }

  function detail(label, value, multiline = false) {
    const line = document.createElement('div');
    line.className = 'detail-row' + (label === 'Description:' ? ' detail-description' : '');
    const heading = document.createElement('span');
    heading.className = 'detail-label';
    heading.textContent = label;
    line.append(heading);
    if (multiline) line.append(document.createElement('br'));
    String(value || '—').split(/\r?\n/).forEach((part, index) => {
      if (index) line.append(document.createElement('br'));
      line.append(document.createTextNode(part));
    });
    return line;
  }

  function render(data) {
    container.replaceChildren();
    setStatus(`${data.length} ${data.length === 1 ? 'recipe' : 'recipes'} found.`);
    if (!data.length) {
      const empty = document.createElement('p');
      empty.textContent = 'No crafting items found.';
      container.append(empty);
      return;
    }
    data.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'crafting-item';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'crafting-item-header';
      button.textContent = item.name || item.item_name || 'Unnamed Item';
      button.setAttribute('aria-expanded', 'false');
      const panel = document.createElement('div');
      panel.className = 'crafting-item-body';
      panel.id = `recipe-details-${index}`;
      panel.hidden = true;
      button.setAttribute('aria-controls', panel.id);
      panel.append(
        detail('Materials:', item.materials || item.crafting_materials, true),
        detail('Crafting Time:', item.crafting_time || item.time),
        detail('Rarity:', item.rarity),
        detail('Profession:', professionOf(item)),
        detail('Description:', item.description, true)
      );
      button.addEventListener('click', () => {
        panel.hidden = !panel.hidden;
        button.setAttribute('aria-expanded', String(!panel.hidden));
        card.classList.toggle('open', !panel.hidden);
      });
      card.append(button, panel);
      container.append(card);
    });
  }

  function applyFilters() {
    const query = searchInput.value.trim().toLowerCase();
    const profession = professionFilter.value.trim().toLowerCase();
    render(items.filter(item =>
      (!query || Object.values(item).some(value => String(value).toLowerCase().includes(query))) &&
      (!profession || professionOf(item).trim().toLowerCase() === profession)
    ));
  }

  searchInput.addEventListener('input', applyFilters);
  professionFilter.addEventListener('change', applyFilters);
  fetch(sheetURL).then(response => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.text();
  }).then(csv => {
    items = csvToObjects(csv);
    populateProfessions();
    applyFilters();
  }).catch(error => {
    console.error('Recipe data unavailable:', error);
    setStatus('Could not load recipes. Please try again later.');
  });
})();
