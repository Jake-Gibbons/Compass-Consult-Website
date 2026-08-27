/* Enhances pages/resources.html after js/resources.js has rendered the library. */
(function enhanceResourceLibrary() {
  const grid = document.getElementById('resourceGrid');
  if (!grid) return;

  const featuredIds = new Set([7, 12, 25, 28, 34, 37]);

  function collapseExpandedTitles(exceptRow) {
    grid.querySelectorAll('.resource-tree__row.is-title-expanded').forEach((row) => {
      if (row === exceptRow) return;
      row.classList.remove('is-title-expanded');
      const name = row.querySelector('.resource-tree__file-name');
      if (name) name.setAttribute('aria-expanded', 'false');
    });
  }

  function isTitleTruncated(el) {
    return el.scrollWidth > el.clientWidth + 1;
  }

  function bindTitleReveal(row) {
    const name = row.querySelector('.resource-tree__file-name');
    if (!name || name.dataset.titleReveal === 'true') return;
    name.dataset.titleReveal = 'true';
    if (name.tagName !== 'BUTTON') {
      name.setAttribute('tabindex', '0');
      name.setAttribute('role', 'button');
    }
    name.setAttribute('aria-expanded', 'false');

    const toggle = (event) => {
      event.preventDefault();
      event.stopPropagation();
      const alreadyOpen = row.classList.contains('is-title-expanded');
      collapseExpandedTitles(alreadyOpen ? null : row);
      if (alreadyOpen) {
        row.classList.remove('is-title-expanded');
        name.setAttribute('aria-expanded', 'false');
        return;
      }
      if (!isTitleTruncated(name) && !alreadyOpen) {
        // Still allow an explicit wrap if the title is long enough to wrap at this width.
        if (name.textContent.trim().length < 42) return;
      }
      row.classList.add('is-title-expanded');
      name.setAttribute('aria-expanded', 'true');
      name.focus();
    };

    name.addEventListener('click', toggle);
    name.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') toggle(event);
    });
    name.addEventListener('blur', () => {
      window.setTimeout(() => {
        if (row.contains(document.activeElement)) return;
        row.classList.remove('is-title-expanded');
        name.setAttribute('aria-expanded', 'false');
      }, 0);
    });
  }

  function markFeaturedRows() {
    grid.querySelectorAll('.resource-tree__row[data-resource-id]').forEach((row) => {
      const id = Number(row.dataset.resourceId);
      if (!featuredIds.has(id) || row.querySelector('.resource-tree__featured')) return;
      row.classList.add('is-featured');
      const meta = row.querySelector('.resource-tree__meta');
      if (!meta) return;
      const badge = document.createElement('span');
      badge.className = 'resource-tree__featured';
      badge.textContent = 'Featured';
      meta.insertBefore(badge, meta.firstChild);
    });
  }

  function renderFeaturedRail() {
    if (grid.querySelector('.resource-tree__featured-rail')) return;
    const featuredRows = Array.from(grid.querySelectorAll('.resource-tree__row[data-resource-id]'))
      .filter((row) => featuredIds.has(Number(row.dataset.resourceId)));
    if (!featuredRows.length) return;

    const seen = new Set();
    const items = [];
    featuredRows.forEach((row) => {
      const id = row.dataset.resourceId;
      if (seen.has(id)) return;
      seen.add(id);
      const title = row.querySelector('.resource-tree__file-name');
      const desc = row.querySelector('.resource-tree__file-desc');
      const download = row.querySelector('a.resource-tree__download');
      if (!title || !download) return;
      items.push({
        title: title.textContent.trim(),
        desc: desc ? desc.textContent.trim() : '',
        href: download.getAttribute('href')
      });
    });
    if (!items.length) return;

    const rail = document.createElement('section');
    rail.className = 'resource-tree__featured-rail is-collapsed';
    rail.setAttribute('aria-label', 'Featured documents');

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'resource-tree__featured-rail-toggle';
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="shrink-0 resource-tree__chevron w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
      <svg xmlns="http://www.w3.org/2000/svg" class="shrink-0 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
      <span>Featured documents</span>
      <span class="resource-tree__count">${items.length}</span>
    `;

    const list = document.createElement('div');
    list.className = 'resource-tree__featured-list';
    list.innerHTML = items.map((item) => `
      <article class="resource-tree__featured-item">
        <span class="resource-tree__featured-item-name">${item.title}</span>
        <a href="${item.href}" download class="resource-tree__details-download">Download</a>
      </article>
    `).join('');

    toggleBtn.addEventListener('click', () => {
      const collapsed = rail.classList.toggle('is-collapsed');
      toggleBtn.setAttribute('aria-expanded', String(!collapsed));
    });

    rail.appendChild(toggleBtn);
    rail.appendChild(list);
    grid.insertBefore(rail, grid.firstChild);
  }

  function enhance() {
    grid.querySelectorAll('.resource-tree__row').forEach(bindTitleReveal);
    markFeaturedRows();
    renderFeaturedRail();
  }

  enhance();
  const observer = new MutationObserver(() => enhance());
  observer.observe(grid, { childList: true, subtree: true });
})();
