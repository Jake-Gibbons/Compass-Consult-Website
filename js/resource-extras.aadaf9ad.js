/* Enhances pages/resources.html after js/resources.js has rendered the library. */
(function enhanceResourceLibrary() {
  const grid = document.getElementById('resourceGrid');
  if (!grid) return;

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

  function enhance() {
    grid.querySelectorAll('.resource-tree__row').forEach(bindTitleReveal);
  }

  enhance();
  const observer = new MutationObserver(() => enhance());
  observer.observe(grid, { childList: true, subtree: true });
})();
