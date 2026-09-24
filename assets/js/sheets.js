(() => {
  const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTGEGjryoMoYyFZIWPFrYLLO9M9Z0zq0lbIB4xIe-_-VqRwAQ6KP2ley9HpuDokO9i07lbDD4CnKqVT/pub?gid=1358917249&single=true&output=csv';
  const container = document.getElementById('crafting-list');
  const searchInput = document.getElementById('search');
  const professionFilter = document.getElementById('profession-filter');
  const status = document.getElementById('search-status');
  const clearFilters = document.getElementById('clear-filters');
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
    // Published sheet headings can include notes, e.g. "Crafting Profession / Branch".
    const key = Object.keys(item).find(name => /profess|branch|category|crafting_type|type_of_craft/.test(name) && item[name]);
    return key ? item[key].trim() : '';
  }

  function professionNames(item) {
    return professionOf(item).split(/[,;\n]+/).map(name => name.trim()).filter(Boolean);
  }

  function iconFor(profession) {
    const name = profession.toLowerCase();
    if (name.includes('alchem') || name.includes('poison')) return '⚗';
    if (name.includes('smith') || name.includes('engineer')) return '⚒';
    if (name.includes('cook')) return '✿';
    if (name.includes('scroll') || name.includes('rune') || name.includes('enchant')) return '✧';
    if (name.includes('wood') || name.includes('leather')) return '❧';
    return '✦';
  }

  function populateProfessions() {
    const names = [...new Set(items.flatMap(professionNames))]
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
      empty.className = 'empty-glade';
      empty.textContent = '✧ No recipes in this glade. Try another search! ✧';
      container.append(empty);
      return;
    }
    data.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'crafting-item';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'crafting-item-header';
      const icon = document.createElement('span');
      icon.className = 'recipe-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = iconFor(professionOf(item));
      const name = document.createElement('span');
      name.className = 'item-name';
      name.textContent = item.name || item.item_name || 'Unnamed Item';
      button.append(icon, name);
      if (item.rarity) {
        const badge = document.createElement('span');
        badge.className = 'rarity-badge';
        badge.textContent = item.rarity;
        button.append(badge);
      }
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
      (!profession || professionNames(item).some(name => name.toLowerCase() === profession))
    ));
  }

  searchInput.addEventListener('input', applyFilters);
  professionFilter.addEventListener('change', applyFilters);
  clearFilters?.addEventListener('click', () => {
    searchInput.value = '';
    professionFilter.value = '';
    applyFilters();
    searchInput.focus();
  });
  fetch(sheetURL).then(response => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.text();
  }).then(csv => {
    items = csvToObjects(csv);
    populateProfessions();
    applyFilters();
    if (items.length && professionFilter.options.length === 1) {
      setStatus('Recipes loaded, but the sheet has no profession data. Check its column heading.');
      console.warn('No profession values found. CSV columns:', Object.keys(items[0]));
    }
  }).catch(error => {
    console.error('Recipe data unavailable:', error);
    setStatus('Could not load recipes. Please try again later.');
  });
})();
