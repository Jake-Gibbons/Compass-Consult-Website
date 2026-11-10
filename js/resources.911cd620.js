import {
  compareEntries,
  escapeHtml,
  filterEntries,
  formatBytes,
  groupEntries,
  renderResourceRow
} from './resource-library-model.d25b571f.mjs';

const grid = document.getElementById('resourceGrid');
const gridSpacer = document.getElementById('resourceGridSpacer');
const noResults = document.getElementById('noResults');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const infographicViewer = document.getElementById('infographicViewer');
const infographicViewerImage = document.getElementById('infographicViewerImage');
const infographicViewerTitle = document.getElementById('infographicViewerTitle');
const infographicViewerCategory = document.getElementById('infographicViewerCategory');
const infographicViewerDownload = document.getElementById('infographicViewerDownload');
const infographicViewerError = document.getElementById('infographicViewerError');
const scopeButtons = document.querySelectorAll('.resource-window__scope');
const directoryButtons = document.querySelectorAll('[data-directory]');
const stateStorageKey = 'compass-resource-library-state';

let infographicViewerTrigger = null;
let entries = [];
let currentView = 'type';
let currentDirectory = 'files';
let currentSort = 'newest';
let currentScope = 'all';

function renderResourceIcons() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

function saveDirectoryState() {
  try {
    localStorage.setItem(stateStorageKey, JSON.stringify({
      directory: currentDirectory,
      view: currentView,
      sort: currentSort,
      scope: currentScope,
      search: searchInput.value
    }));
  } catch {
    // Storage is optional; the directory remains usable without it.
  }
}

function formatDocumentDate(entry) {
  return entry.documentDateLabel || 'Date not stated on the file';
}

function findEntry(id) {
  return entries.find((entry) => entry.id === id);
}

function showResourceDetails(entry, row, infoButton) {
  document.querySelectorAll('.resource-tree__inline-details').forEach((details) => details.remove());
  document.querySelectorAll('[data-resource-info]').forEach((button) => button.setAttribute('aria-expanded', 'false'));
  const organizations = entry.organizations || [];
  const topics = entry.topics || [];
  const resourceDetails = document.createElement('aside');
  resourceDetails.className = 'resource-tree__details resource-tree__inline-details';
  resourceDetails.setAttribute('aria-live', 'polite');
  const fileNote = entry.aliasOf ? '<span>Same stored file as another listing</span>' : '';
  resourceDetails.innerHTML = `
    <div>
      <h2>${escapeHtml(entry.title)}</h2>
      <p>${escapeHtml(entry.description)}</p>
      <div class="resource-tree__details-meta">
        <span>${escapeHtml(entry.topic)}</span>
        ${entry.subtopic ? `<span>${escapeHtml(entry.subtopic)}</span>` : ''}
        <span>${escapeHtml(entry.format)}</span>
        <span>${escapeHtml(entry.originalFilename)}</span>
        <span>${escapeHtml(formatBytes(entry.bytes))}</span>
        <span>Document date: ${escapeHtml(formatDocumentDate(entry))}</span>
        ${entry.audience ? `<span>${escapeHtml(entry.audience)}</span>` : ''}
        ${fileNote}
        ${organizations.map((name) => `<span>${escapeHtml(name)}</span>`).join('')}
        ${topics.map((name) => `<span>${escapeHtml(name)}</span>`).join('')}
      </div>
    </div>
    <div class="resource-tree__details-actions">
      <button type="button" class="resource-tree__download resource-tree__details-close" aria-label="Close document details" title="Close details"><i data-lucide="x" class="shrink-0 w-4 h-4"></i></button>
      ${entry.format === 'PNG' ? `<button type="button" class="resource-tree__details-download" data-resource-view="${escapeHtml(entry.id)}">View infographic</button>` : ''}
      <a href="${escapeHtml(encodeURI(entry.url))}" download="${escapeHtml(entry.originalFilename)}" class="resource-tree__details-download"><i data-lucide="download" class="shrink-0 w-4 h-4"></i>Download ${escapeHtml(entry.format)}</a>
    </div>
  `;
  row.insertAdjacentElement('afterend', resourceDetails);
  infoButton.setAttribute('aria-expanded', 'true');
  resourceDetails.querySelector('.resource-tree__details-close').addEventListener('click', () => {
    resourceDetails.remove();
    infoButton.setAttribute('aria-expanded', 'false');
  });
  const viewButton = resourceDetails.querySelector('[data-resource-view]');
  if (viewButton) {
    viewButton.addEventListener('click', () => showInfographicViewer(entry, viewButton));
  }
  renderResourceIcons();
}

function showInfographicViewer(entry, trigger) {
  if (entry.format !== 'PNG') return;
  infographicViewerTrigger = trigger;
  infographicViewerTitle.textContent = entry.title;
  infographicViewerCategory.textContent = entry.subtopic ? `${entry.topic} / ${entry.subtopic}` : entry.topic;
  infographicViewerImage.alt = entry.alt || entry.title;
  infographicViewerImage.src = encodeURI(entry.url);
  infographicViewerDownload.href = encodeURI(entry.url);
  infographicViewerDownload.setAttribute('download', entry.originalFilename);
  infographicViewerError.hidden = true;
  infographicViewerImage.hidden = false;
  infographicViewerImage.onerror = () => {
    infographicViewerImage.hidden = true;
    infographicViewerError.hidden = false;
  };
  if (!infographicViewer.open) infographicViewer.showModal();
}

function renderFolder(name, folderId, items, options) {
  const nested = (options.children || []).map((child, childIndex) => renderFolder(
    child.name,
    `${folderId}-${childIndex}`,
    child.entries,
    { nested: true, expanded: options.expanded }
  )).join('');
  const expanded = options.expanded || options.featured;
  return `
    <section class="resource-tree__folder${options.nested ? ' resource-tree__folder--nested' : ''}${options.featured ? ' resource-tree__folder--featured' : ''}${expanded ? '' : ' is-collapsed'}" data-category="${escapeHtml(name)}">
      <button type="button" class="resource-tree__folder-toggle" aria-expanded="${expanded ? 'true' : 'false'}" aria-controls="${folderId}">
        <i data-lucide="chevron-down" class="shrink-0 resource-tree__chevron w-4 h-4" aria-hidden="true"></i>
        <i data-lucide="${options.featured ? 'star' : 'folder-open'}" class="shrink-0 resource-tree__folder-icon w-4 h-4" aria-hidden="true"></i>
        <span>${escapeHtml(name)}</span>
        <span class="resource-tree__count">${options.count}</span>
      </button>
      <div id="${folderId}" class="resource-tree__files">
        ${items.map((entry) => renderResourceRow(entry)).join('')}
        ${nested}
      </div>
    </section>
  `;
}

function renderResources(data) {
  const searchActive = Boolean(searchInput.value.trim());
  if (data.length === 0) {
    grid.classList.remove('hidden');
    if (gridSpacer) gridSpacer.classList.add('hidden');
    noResults.classList.remove('hidden');
  } else {
    grid.classList.remove('hidden');
    if (gridSpacer) gridSpacer.classList.remove('hidden');
    noResults.classList.add('hidden');
  }

  const grouped = groupEntries(data, 'folders');
  const listedCount = data.length;
  const sortWithin = (items) => [...items].sort((left, right) => compareEntries(left, right, currentSort));
  const foldersHtml = grouped.groups.map((group, index) => {
    const direct = sortWithin(group.direct);
    const children = group.children.map((child) => ({ name: child.name, entries: sortWithin(child.entries) }));
    const count = direct.length + children.reduce((total, child) => total + child.entries.length, 0);
    return renderFolder(group.name, `resource-folder-${index}`, direct, {
      expanded: searchActive,
      count,
      children
    });
  }).join('');

  grid.innerHTML = `
    <div class="resource-tree__root">
      <i data-lucide="folder-open" class="shrink-0 w-4 h-4" aria-hidden="true"></i>
      <span>Resource library</span>
      <span class="resource-tree__count">${listedCount} files</span>
      <span class="resource-tree__breadcrumb" aria-label="Current directory">/ supplied folder</span>
    </div>
    ${foldersHtml}
  `;

  scopeButtons.forEach((button) => button.classList.remove('hidden'));
  directoryButtons.forEach((button) => {
    const isActive = button.dataset.directory === currentDirectory;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

  grid.querySelectorAll('.resource-tree__folder-toggle').forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const folder = toggle.closest('.resource-tree__folder');
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      folder.classList.toggle('is-collapsed', expanded);
    });
  });

  grid.querySelectorAll('[data-view]').forEach((viewButton) => {
    viewButton.addEventListener('click', () => {
      currentView = viewButton.dataset.view;
      saveDirectoryState();
      filterData();
    });
  });

  grid.querySelectorAll('[data-resource-info]').forEach((infoButton) => {
    infoButton.addEventListener('click', () => {
      const entry = findEntry(infoButton.dataset.resourceInfo);
      const row = infoButton.closest('.resource-tree__row');
      const inlineDetails = row.nextElementSibling;
      if (inlineDetails?.classList.contains('resource-tree__inline-details')) {
        inlineDetails.remove();
        infoButton.setAttribute('aria-expanded', 'false');
        return;
      }
      if (entry) showResourceDetails(entry, row, infoButton);
    });
  });

  grid.querySelectorAll('[data-resource-view]').forEach((viewButton) => {
    viewButton.addEventListener('click', () => {
      const entry = findEntry(viewButton.dataset.resourceView);
      if (entry) showInfographicViewer(entry, viewButton);
    });
  });

  renderResourceIcons();
}

function filterData() {
  const filtered = filterEntries(entries, {
    search: searchInput.value
  }).sort((left, right) => compareEntries(left, right, currentSort));
  renderResources(filtered);
}

function bindControls() {
  infographicViewer.querySelector('[data-viewer-close]').addEventListener('click', () => infographicViewer.close());
  infographicViewer.addEventListener('click', (event) => {
    if (event.target === infographicViewer) infographicViewer.close();
  });
  infographicViewer.addEventListener('cancel', (event) => {
    event.preventDefault();
    infographicViewer.close();
  });
  infographicViewer.addEventListener('close', () => {
    if (infographicViewerTrigger?.isConnected) infographicViewerTrigger.focus();
    infographicViewerTrigger = null;
    infographicViewerImage.removeAttribute('src');
  });

  searchInput.addEventListener('input', () => {
    saveDirectoryState();
    filterData();
  });
  sortSelect.addEventListener('change', () => {
    currentSort = sortSelect.value;
    saveDirectoryState();
    filterData();
  });
  scopeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      currentScope = button.dataset.scope;
      scopeButtons.forEach((scopeButton) => scopeButton.classList.toggle('is-active', scopeButton === button));
      saveDirectoryState();
      filterData();
    });
  });
  directoryButtons.forEach((button) => {
    button.addEventListener('click', () => {
      currentDirectory = button.dataset.directory;
      currentScope = 'all';
      scopeButtons.forEach((scopeButton) => scopeButton.classList.toggle('is-active', scopeButton.dataset.scope === currentScope));
      saveDirectoryState();
      filterData();
    });
  });
}

async function loadCatalogue() {
  grid.innerHTML = '<p class="resource-tree__loading">Loading the resource library…</p>';
  const response = await fetch('/data/resource-library.json', { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('catalogue request failed');
  const catalogue = await response.json();
  if (!Array.isArray(catalogue.entries)) throw new Error('catalogue entries missing');
  entries = catalogue.entries;
  filterData();
}

function readSavedState() {
  let savedState = {};
  try {
    savedState = JSON.parse(localStorage.getItem(stateStorageKey) || '{}');
  } catch {
    savedState = {};
  }
  currentSort = ['newest', 'alphabetical', 'added'].includes(savedState.sort) ? savedState.sort : 'alphabetical';
  sortSelect.value = currentSort;
  searchInput.value = savedState.search || '';
}

readSavedState();
bindControls();
loadCatalogue().catch(() => {
  grid.innerHTML = '<p class="resource-tree__loading">The resource library could not be loaded. Please refresh the page.</p>';
});
