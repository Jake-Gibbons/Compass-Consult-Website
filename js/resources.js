import {
  compareEntries,
  escapeHtml,
  filterEntries,
  formatBytes,
  groupEntries,
  renderResourceRow,
  zoomViewerAt
} from './resource-library-model.mjs';

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
const infographicViewerStage = document.getElementById('infographicViewerStage');
const infographicViewerContent = document.getElementById('infographicViewerContent');
const infographicViewerCanvas = document.getElementById('infographicViewerCanvas');
const infographicViewerStatus = document.getElementById('infographicViewerStatus');
const infographicViewerPages = document.getElementById('infographicViewerPages');
const infographicViewerPage = document.getElementById('infographicViewerPage');
const infographicViewerZoom = document.getElementById('infographicViewerZoom');
const infographicViewerOpen = document.getElementById('infographicViewerOpen');
const scopeButtons = document.querySelectorAll('.resource-window__scope');
const directoryButtons = document.querySelectorAll('[data-directory]');
const stateStorageKey = 'compass-resource-library-state';

let infographicViewerTrigger = null;
const viewerState = {
  mode: '',
  scale: 1,
  x: 0,
  y: 0,
  page: 1,
  pages: 1,
  pdf: null,
  loadingTask: null,
  renderTask: null,
  renderToken: 0,
  renderTimer: 0
};
const viewerPointers = new Map();
let viewerPinch = null;
let viewerGeneration = 0;
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
      ${entry.format === 'PNG' || entry.format === 'PDF' ? `<button type="button" class="resource-tree__details-download" data-resource-view="${escapeHtml(entry.id)}">View</button>` : ''}
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

function pointerDistance() {
  const points = [...viewerPointers.values()];
  if (points.length < 2) return 0;
  return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
}

function resetViewerTransform() {
  viewerState.scale = 1;
  viewerState.x = 0;
  viewerState.y = 0;
  applyViewerTransform();
}

function applyViewerTransform() {
  infographicViewerContent.style.transform = `translate(${viewerState.x}px, ${viewerState.y}px) scale(${viewerState.scale})`;
  infographicViewerZoom.textContent = `${Math.round(viewerState.scale * 100)}%`;
}

function viewerRect() {
  return infographicViewerStage.getBoundingClientRect();
}

function zoomViewerBy(factor, clientX, clientY) {
  const rect = viewerRect();
  const next = zoomViewerAt(viewerState, {
    clientX: clientX ?? rect.left + rect.width / 2,
    clientY: clientY ?? rect.top + rect.height / 2,
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    factor
  });
  viewerState.scale = next.scale;
  viewerState.x = next.x;
  viewerState.y = next.y;
  applyViewerTransform();
  if (viewerState.mode === 'pdf') schedulePdfRender();
}

function showViewerMessage(kind) {
  infographicViewerStatus.hidden = kind !== 'loading';
  infographicViewerError.hidden = kind !== 'error';
  infographicViewerImage.hidden = kind !== 'image';
  infographicViewerCanvas.hidden = kind !== 'pdf';
}

async function releasePdf() {
  viewerState.renderToken += 1;
  window.clearTimeout(viewerState.renderTimer);
  const renderTask = viewerState.renderTask;
  const loadingTask = viewerState.loadingTask;
  const pdf = viewerState.pdf;
  viewerState.renderTask = null;
  viewerState.loadingTask = null;
  viewerState.pdf = null;
  if (renderTask) {
    try { await renderTask.cancel(); } catch { /* already finished */ }
  }
  if (loadingTask) {
    try { await loadingTask.destroy(); } catch { /* already closed */ }
  }
  if (pdf) {
    try { await pdf.destroy(); } catch { /* already closed */ }
  }
  infographicViewerCanvas.width = 0;
  infographicViewerCanvas.height = 0;
}

async function renderPdfPage() {
  const token = viewerState.renderToken;
  const pdf = viewerState.pdf;
  if (!pdf) return;
  const page = await pdf.getPage(viewerState.page);
  if (token !== viewerState.renderToken) return;
  const unscaled = page.getViewport({ scale: 1 });
  const fit = Math.min(
    (infographicViewerStage.clientWidth - 24) / unscaled.width,
    (infographicViewerStage.clientHeight - 24) / unscaled.height
  );
  const bitmapZoom = Math.min(Math.max(viewerState.scale, 1), 2.2);
  let pixelScale = Math.max(fit, 0.2) * bitmapZoom * (window.devicePixelRatio || 1);
  const longest = Math.max(unscaled.width, unscaled.height) * pixelScale;
  if (longest > 2200) pixelScale *= 2200 / longest;
  const viewport = page.getViewport({ scale: pixelScale });
  infographicViewerCanvas.width = Math.floor(viewport.width);
  infographicViewerCanvas.height = Math.floor(viewport.height);
  infographicViewerCanvas.style.width = `${Math.floor(unscaled.width * fit)}px`;
  infographicViewerCanvas.style.height = `${Math.floor(unscaled.height * fit)}px`;
  if (viewerState.renderTask) {
    try { await viewerState.renderTask.cancel(); } catch { /* already finished */ }
  }
  const task = page.render({ canvasContext: infographicViewerCanvas.getContext('2d'), viewport });
  viewerState.renderTask = task;
  try {
    await task.promise;
  } catch (error) {
    if (error?.name === 'RenderingCancelledException') return;
    throw error;
  }
  if (token !== viewerState.renderToken) return;
  showViewerMessage('pdf');
  infographicViewerPage.textContent = `Page ${viewerState.page} of ${viewerState.pages}`;
  infographicViewerPages.querySelector('[data-page="prev"]').disabled = viewerState.page <= 1;
  infographicViewerPages.querySelector('[data-page="next"]').disabled = viewerState.page >= viewerState.pages;
}

function schedulePdfRender() {
  window.clearTimeout(viewerState.renderTimer);
  viewerState.renderTimer = window.setTimeout(() => {
    renderPdfPage().catch(() => showViewerMessage('error'));
  }, 140);
}

async function openPdf(url, generation) {
  showViewerMessage('loading');
  infographicViewerPages.hidden = false;
  const pdfjs = await import('/js/pdfjs/pdf.min.mjs');
  if (generation !== viewerGeneration) return;
  pdfjs.GlobalWorkerOptions.workerSrc = '/js/pdfjs/pdf.worker.min.mjs';
  const loadingTask = pdfjs.getDocument({ url, disableAutoFetch: true });
  viewerState.loadingTask = loadingTask;
  const pdf = await loadingTask.promise;
  if (generation !== viewerGeneration) {
    pdf.destroy();
    return;
  }
  viewerState.pdf = pdf;
  viewerState.pages = pdf.numPages;
  viewerState.page = 1;
  await renderPdfPage();
}

function showInfographicViewer(entry, trigger) {
  if (entry.format !== 'PNG' && entry.format !== 'PDF') return;
  infographicViewerTrigger = trigger;
  infographicViewerTitle.textContent = entry.title;
  infographicViewerCategory.textContent = entry.subtopic ? `${entry.topic} / ${entry.subtopic}` : entry.topic;
  const fileUrl = encodeURI(entry.url);
  infographicViewerDownload.href = fileUrl;
  infographicViewerDownload.setAttribute('download', entry.originalFilename);
  infographicViewerOpen.href = fileUrl;
  resetViewerTransform();
  viewerGeneration += 1;
  const generation = viewerGeneration;
  releasePdf();
  viewerState.mode = entry.format === 'PDF' ? 'pdf' : 'image';
  infographicViewerPages.hidden = viewerState.mode !== 'pdf';
  infographicViewerError.hidden = true;
  if (viewerState.mode === 'image') {
    showViewerMessage('image');
    infographicViewerImage.alt = entry.alt || entry.title;
    infographicViewerImage.src = fileUrl;
    infographicViewerImage.onerror = () => showViewerMessage('error');
  } else {
    infographicViewerImage.removeAttribute('src');
    openPdf(fileUrl, generation).catch(() => {
      if (generation === viewerGeneration) showViewerMessage('error');
    });
  }
  if (!infographicViewer.open) infographicViewer.showModal();
  infographicViewerStage.focus();
}

async function changePdfPage(delta) {
  const next = viewerState.page + delta;
  if (viewerState.mode !== 'pdf' || next < 1 || next > viewerState.pages) return;
  viewerState.page = next;
  resetViewerTransform();
  try {
    await renderPdfPage();
  } catch {
    showViewerMessage('error');
  }
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
  const featured = sortWithin(grouped.featured);
  const featuredHtml = featured.length ? renderFolder('Featured', 'resource-folder-featured', featured, {
    featured: true,
    expanded: true,
    count: featured.length,
    children: []
  }) : '';
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
    ${featuredHtml}
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
    search: searchInput.value,
    scope: currentScope
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
    releasePdf();
    resetViewerTransform();
    viewerPointers.clear();
    viewerPinch = null;
  });
  infographicViewer.querySelectorAll('[data-zoom]').forEach((button) => {
    button.addEventListener('click', () => {
      if (button.dataset.zoom === 'reset') {
        resetViewerTransform();
        if (viewerState.mode === 'pdf') schedulePdfRender();
        return;
      }
      zoomViewerBy(button.dataset.zoom === 'in' ? 1.25 : 0.8);
    });
  });
  infographicViewer.querySelectorAll('[data-page]').forEach((button) => {
    button.addEventListener('click', () => changePdfPage(button.dataset.page === 'next' ? 1 : -1));
  });
  infographicViewerStage.addEventListener('wheel', (event) => {
    if (!infographicViewer.open) return;
    event.preventDefault();
    zoomViewerBy(event.deltaY < 0 ? 1.12 : 0.89, event.clientX, event.clientY);
  }, { passive: false });
  infographicViewerStage.addEventListener('pointerdown', (event) => {
    infographicViewerStage.setPointerCapture(event.pointerId);
    viewerPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (viewerPointers.size === 2) {
      viewerPinch = { distance: pointerDistance(), scale: viewerState.scale };
      infographicViewerStage.classList.add('is-panning');
    }
  });
  infographicViewerStage.addEventListener('pointermove', (event) => {
    if (!viewerPointers.has(event.pointerId)) return;
    const previous = viewerPointers.get(event.pointerId);
    viewerPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (viewerPointers.size >= 2 && viewerPinch) {
      const distance = pointerDistance();
      if (viewerPinch.distance > 0) {
        const rect = viewerRect();
        const points = [...viewerPointers.values()];
        const next = zoomViewerAt(viewerState, {
          clientX: (points[0].x + points[1].x) / 2,
          clientY: (points[0].y + points[1].y) / 2,
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          factor: (viewerPinch.scale * (distance / viewerPinch.distance)) / viewerState.scale
        });
        viewerState.scale = next.scale;
        viewerState.x = next.x;
        viewerState.y = next.y;
        applyViewerTransform();
        if (viewerState.mode === 'pdf') schedulePdfRender();
      }
      return;
    }
    if (viewerState.scale > 1) {
      viewerState.x += event.clientX - previous.x;
      viewerState.y += event.clientY - previous.y;
      applyViewerTransform();
      infographicViewerStage.classList.add('is-panning');
    }
  });
  const endPointer = (event) => {
    viewerPointers.delete(event.pointerId);
    if (viewerPointers.size < 2) viewerPinch = null;
    if (viewerPointers.size === 0) infographicViewerStage.classList.remove('is-panning');
  };
  infographicViewerStage.addEventListener('pointerup', endPointer);
  infographicViewerStage.addEventListener('pointercancel', endPointer);
  infographicViewer.addEventListener('keydown', (event) => {
    if (!infographicViewer.open) return;
    if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      zoomViewerBy(1.25);
    } else if (event.key === '-' || event.key === '_') {
      event.preventDefault();
      zoomViewerBy(0.8);
    } else if (event.key === '0') {
      event.preventDefault();
      resetViewerTransform();
      if (viewerState.mode === 'pdf') schedulePdfRender();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      changePdfPage(1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      changePdfPage(-1);
    }
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
  currentScope = ['all', 'new', 'featured'].includes(savedState.scope) ? savedState.scope : 'all';
  sortSelect.value = currentSort;
  searchInput.value = savedState.search || '';
  scopeButtons.forEach((button) => button.classList.toggle('is-active', button.dataset.scope === currentScope));
}

readSavedState();
bindControls();
loadCatalogue().catch(() => {
  grid.innerHTML = '<p class="resource-tree__loading">The resource library could not be loaded. Please refresh the page.</p>';
});
