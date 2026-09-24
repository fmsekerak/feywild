(() => {
  const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTGEGjryoMoYyFZIWPFrYLLO9M9Z0zq0lbIB4xIe-_-VqRwAQ6KP2ley9HpuDokO9i07lbDD4CnKqVT/pub?gid=1358917249&single=true&output=csv';
  const container = document.getElementById('crafting-list');
  const searchInput = document.getElementById('search');
  const professionFilter = document.getElementById('profession-filter');
  const rarityFilter = document.getElementById('rarity-filter');
  const status = document.getElementById('search-status');
  const clearFilters = document.getElementById('clear-filters');
  if (!container || !searchInput || !professionFilter || !rarityFilter) return;

  const knownProfessions = [
    'Alchemy', 'Blacksmithing', 'Cooking', 'Enchanting', 'Leatherworking',
    'Runecarving - Ancient', 'Runecarving - Academic', 'Scrollscribing',
    'Wand Whittling', 'Woodcarving'
  ];
  let items = [];
  let loaded = false;
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
    // Prefer an explicit column; some sheets label this "Crafting Branch".
    const key = Object.keys(item).find(name => /profess|branch|category|crafting_type|type_of_craft/.test(name) && item[name]);
    if (key) return item[key].trim();
    // Older sheet exports may use an unlabeled column for the profession.
    const values = Object.entries(item).filter(([name]) => !/name|description|material|rarity|time/.test(name));
    const match = values.find(([, value]) => value.split(/[,;\n]+/).some(part =>
      knownProfessions.some(profession => profession.toLowerCase() === part.trim().toLowerCase())
    ));
    return match ? match[1].trim() : '';
  }

  function professionNames(item) {
    return professionOf(item).split(/[,;\n]+/).map(name => name.trim()).filter(Boolean);
  }

  function rarityOf(item) {
    const key = Object.keys(item).find(name => /rarity/.test(name) && item[name]);
    return key ? item[key].trim() : '';
  }

  function iconFor(profession) {
    const name = profession.toLowerCase();
    if (name.includes('alchem') || name.includes('poison')) return '⚗️';
    if (name.includes('smith')) return '⚔️';
    if (name.includes('brew')) return '🍺';
    if (name.includes('cook')) return '🥩';
    if (name.includes('scroll')) return '📜';
    if (name.includes('academic')) return '⚚';
    if (name.includes('ancient')) return '⚸';
    if (name.includes('rune')) return 'ᛟ';
    if (name.includes('enchant')) return '🪄';
    if (name.includes('wood')) return '🏹';
    if (name.includes('cobb')) return '👞';
    if (name.includes('jewel')) return '💍';
    if (name.includes('leather')) return '💼';
    if (name.includes('tailor')) return '🧵';
    if (name.includes('engineer') || name.includes('tinker')) return '🛠️';
    if (name.includes('wand')) return '🪄';

    return '✦';
  }

  function populateProfessions() {
    const names = [...new Set([...knownProfessions, ...items.flatMap(professionNames)])]
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    professionFilter.replaceChildren(new Option('All Professions', ''),
      ...names.map(name => new Option(name, name)));
  }

  function populateRarities() {
    const order = ['common', 'uncommon', 'rare', 'very rare', 'legendary', 'artifact'];
    const names = [...new Map(items.map(rarityOf).filter(Boolean)
      .map(name => [name.toLowerCase(), name])).values()]
      .sort((a, b) => {
        const aOrder = order.indexOf(a.toLowerCase());
        const bOrder = order.indexOf(b.toLowerCase());
        if (aOrder !== bOrder) return (aOrder < 0 ? Infinity : aOrder) - (bOrder < 0 ? Infinity : bOrder);
        return a.localeCompare(b, undefined, { sensitivity: 'base' });
      });
    rarityFilter.replaceChildren(new Option('All Rarities', ''),
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
      if (rarityOf(item)) {
        const badge = document.createElement('span');
        badge.className = 'rarity-badge';
        badge.textContent = rarityOf(item);
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
        detail('Rarity:', rarityOf(item)),
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
    if (!loaded) return;
    const query = searchInput.value.trim().toLowerCase();
    const profession = professionFilter.value.trim().toLowerCase();
    const rarity = rarityFilter.value.trim().toLowerCase();
    render(items.filter(item =>
      (!query || Object.values(item).some(value => String(value).toLowerCase().includes(query))) &&
      (!profession || professionNames(item).some(name => name.toLowerCase() === profession)) &&
      (!rarity || rarityOf(item).toLowerCase() === rarity)
    ));
  }

  searchInput.addEventListener('input', applyFilters);
  professionFilter.addEventListener('change', applyFilters);
  rarityFilter.addEventListener('change', applyFilters);
  populateProfessions();
  clearFilters?.addEventListener('click', () => {
    searchInput.value = '';
    professionFilter.value = '';
    rarityFilter.value = '';
    applyFilters();
    searchInput.focus();
  });
  fetch(sheetURL).then(response => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.text();
  }).then(csv => {
    if (/^\s*<!doctype html|^\s*<html/i.test(csv)) throw new Error('Sheet returned HTML instead of CSV');
    items = csvToObjects(csv);
    loaded = true;
    populateProfessions();
    populateRarities();
    applyFilters();
    if (items.length && !items.some(item => professionNames(item).length)) {
      setStatus('Recipes loaded, but no profession values were found in the sheet. Check its profession column.');
      console.warn('No profession values found. CSV columns:', Object.keys(items[0]));
    }
  }).catch(error => {
    console.error('Recipe data unavailable:', error);
    setStatus('Could not load recipes. Please try again later.');
  });
})();
