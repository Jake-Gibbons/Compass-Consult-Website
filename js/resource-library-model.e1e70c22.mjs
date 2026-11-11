/**
 * Pure helpers for the resource library catalogue.
 * Safe to import from the browser and from Node tests.
 */

export const TOPIC_ORDER = [
  'Education & Skills',
  'Employment Policy & Employability',
  'Governance & Project Management',
  'Government & Devolution',
  'Health & Social Care',
  'Housing',
  'Institute of Employability Professionals',
  'Leadership & Management'
];

export const TOPIC_SLUGS = {
  'Education & Skills': 'education-skills',
  'Employment Policy & Employability': 'employment-policy-employability',
  'Governance & Project Management': 'governance-project-management',
  'Government & Devolution': 'government-devolution',
  'Health & Social Care': 'health-social-care',
  'Housing': 'housing',
  'Institute of Employability Professionals': 'institute-of-employability-professionals',
  'Leadership & Management': 'leadership-management'
};

const MONTHS = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  sept: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12
};

const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const ORGANIZATION_RULES = [
  {
    name: 'Department for Work and Pensions (DWP)',
    terms: ['dwp', 'get britain working', 'keep britain working', 'jobs guarantee']
  },
  {
    name: 'Greater London Authority',
    terms: ['greater london authority']
  },
  {
    name: 'UK Government',
    terms: ["king's speech"]
  },
  {
    name: 'Work and Pensions Select Committee',
    terms: ['wpsc']
  }
];

export const TOPIC_RULES = [
  { name: 'Local Growth Fund', terms: ['local growth fund'] },
  { name: 'Youth Guarantee', terms: ['youth guarantee'] },
  { name: 'National Youth Strategy', terms: ['national youth strategy'] },
  { name: 'Local Government Reorganisation', terms: ['local government reorganisation'] },
  { name: 'Access to Work', terms: ['access to work'] },
  { name: 'Jobs Guarantee', terms: ['jobs guarantee'] }
];

/**
 * @param {string} value
 * @returns {string}
 */
export function slugify(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

/**
 * @param {string} topic
 * @returns {string}
 */
export function topicSlug(topic) {
  return TOPIC_SLUGS[topic] || slugify(topic);
}

/**
 * PNG artwork belongs in Infographics. PDF, DOCX and PPTX belong in Files.
 * There is no presentation exception: a slide deck is not an infographic.
 *
 * @param {string} format
 * @returns {string[]}
 */
export function directoriesForFormat(format) {
  if (format === 'PNG') return ['infographics'];
  return ['files'];
}

/**
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * @param {number} year
 * @returns {number}
 */
function expandYear(year) {
  if (year >= 100) return year;
  return 2000 + year;
}

/**
 * Read a document date that is actually written in the filename.
 * Month-only and season labels do not invent a day.
 *
 * @param {string} filename
 * @returns {{ label: string, sortDate: string }}
 */
export function parseDocumentDate(filename) {
  const name = String(filename || '').replace(/\.[^.]+$/, '');

  const fullDay = name.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+(20\d{2})\b/i);
  if (fullDay) {
    const day = Number(fullDay[1]);
    const month = MONTHS[fullDay[2].toLowerCase()];
    const year = Number(fullDay[3]);
    return {
      label: `${day} ${MONTH_NAMES[month]} ${year}`,
      sortDate: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    };
  }

  const dotted = name.match(/\b(\d{1,2})[.](\d{1,2})[.](\d{2}|\d{4})\b/);
  if (dotted) {
    const day = Number(dotted[1]);
    const month = Number(dotted[2]);
    const year = expandYear(Number(dotted[3]));
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return {
        label: `${day} ${MONTH_NAMES[month]} ${year}`,
        sortDate: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      };
    }
  }

  const monthYear = name.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+(20\d{2}|\d{2})\b/i);
  if (monthYear) {
    const month = MONTHS[monthYear[1].toLowerCase()];
    const rawYear = Number(monthYear[2]);
    const year = rawYear < 100 ? expandYear(rawYear) : rawYear;
    return {
      label: `${MONTH_NAMES[month]} ${year}`,
      sortDate: `${year}-${String(month).padStart(2, '0')}-00`
    };
  }

  const season = name.match(/\b(Spring|Summer|Autumn|Winter)\s+(20\d{2})\b/i);
  if (season) {
    const label = `${season[1][0].toUpperCase()}${season[1].slice(1).toLowerCase()} ${season[2]}`;
    const seasonMonth = { spring: '03', summer: '06', autumn: '09', winter: '12' }[season[1].toLowerCase()];
    return {
      label,
      sortDate: `${season[2]}-${seasonMonth}-00`
    };
  }

  return { label: '', sortDate: '' };
}

/**
 * @param {string} value
 * @returns {string}
 */
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * @param {object} entry
 * @returns {string}
 */
export function entrySearchText(entry) {
  return [
    entry.title,
    entry.description,
    entry.originalFilename,
    entry.topic,
    entry.subtopic,
    entry.documentType,
    entry.format,
    entry.url,
    ...(entry.organizations || []),
    ...(entry.topics || [])
  ].join(' ').toLowerCase();
}

/**
 * @param {object[]} entries
 * @param {{ directory?: string, search?: string, scope?: string }} query
 * @returns {object[]}
 */
export function filterEntries(entries, query = {}) {
  const term = String(query.search || '').trim().toLowerCase();
  return entries.filter((entry) => {
    if (query.directory && !(entry.directories || []).includes(query.directory)) return false;
    if (query.scope === 'new' && !entry.isNew) return false;
    if (query.scope === 'featured' && !entry.featured) return false;
    if (!term) return true;
    return entrySearchText(entry).includes(term);
  });
}

/**
 * @param {object} left
 * @param {object} right
 * @param {string} sort
 * @returns {number}
 */
export function compareEntries(left, right, sort) {
  if (sort === 'alphabetical') return left.title.localeCompare(right.title, 'en-GB');
  if (sort === 'added') {
    return (right.addedOrder || 0) - (left.addedOrder || 0) || left.title.localeCompare(right.title, 'en-GB');
  }
  const dateOrder = (right.sortDate || '0000').localeCompare(left.sortDate || '0000');
  if (dateOrder) return dateOrder;
  return (right.addedOrder || 0) - (left.addedOrder || 0) || left.title.localeCompare(right.title, 'en-GB');
}

/**
 * @param {object[]} entries
 * @returns {object[]}
 */
export function dedupeEntries(entries) {
  const seen = new Set();
  const result = [];
  for (const entry of entries) {
    const key = entry.canonicalId || entry.id;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(entry);
  }
  return result;
}

/**
 * @param {object[]} entries
 * @param {'type'|'organization'|'topic'|'collection'|'folders'} view
 * @returns {{ featured: object[], groups: { name: string, direct: object[], children: { name: string, entries: object[] }[] }[] }}
 */
export function groupEntries(entries, view) {
  const folderView = view === 'collection' || view === 'folders';
  const base = folderView ? entries : dedupeEntries(entries);
  const featured = (folderView ? entries : dedupeEntries(entries)).filter((entry) => entry.featured);

  if (folderView) {
    const map = new Map();
    for (const entry of base) {
      const name = entry.topic || 'Misc';
      if (!map.has(name)) map.set(name, { name, direct: [], children: new Map() });
      const folder = map.get(name);
      if (entry.subtopic) {
        if (!folder.children.has(entry.subtopic)) folder.children.set(entry.subtopic, []);
        folder.children.get(entry.subtopic).push(entry);
      } else {
        folder.direct.push(entry);
      }
    }
    const groups = [...map.values()]
      .sort((left, right) => {
        const leftIndex = TOPIC_ORDER.indexOf(left.name);
        const rightIndex = TOPIC_ORDER.indexOf(right.name);
        return (leftIndex === -1 ? TOPIC_ORDER.length : leftIndex) - (rightIndex === -1 ? TOPIC_ORDER.length : rightIndex)
          || left.name.localeCompare(right.name, 'en-GB');
      })
      .map((group) => ({
        name: group.name,
        direct: group.direct,
        children: [...group.children.entries()]
          .sort((left, right) => left[0].localeCompare(right[0], 'en-GB'))
          .map(([name, items]) => ({ name, entries: items }))
      }));
    return { featured, groups };
  }

  const buckets = new Map();
  const add = (name, entry) => {
    if (!buckets.has(name)) buckets.set(name, []);
    buckets.get(name).push(entry);
  };

  for (const entry of base) {
    if (view === 'organization') {
      const names = entry.organizations?.length ? entry.organizations : ['Misc'];
      names.forEach((name) => add(name, entry));
    } else if (view === 'topic') {
      const names = entry.topics?.length ? entry.topics : ['Misc'];
      names.forEach((name) => add(name, entry));
    } else {
      add(entry.documentType || 'Misc', entry);
    }
  }

  const order = view === 'organization'
    ? ['Department for Work and Pensions (DWP)', 'Greater London Authority', 'UK Government', 'Work and Pensions Select Committee', 'Misc']
    : view === 'topic'
      ? ['Local Growth Fund', 'Youth Guarantee', 'National Youth Strategy', 'Local Government Reorganisation', 'Access to Work', 'Jobs Guarantee', 'Misc']
      : ['Factsheets', 'Briefings', 'Blogs', 'Whitepapers', 'Guides', 'Presentations', 'Infographics', 'Other', 'Misc'];

  const groups = [...buckets.entries()]
    .sort((left, right) => {
      const leftIndex = order.indexOf(left[0]);
      const rightIndex = order.indexOf(right[0]);
      return (leftIndex === -1 ? order.length : leftIndex) - (rightIndex === -1 ? order.length : rightIndex)
        || left[0].localeCompare(right[0], 'en-GB');
    })
    .map(([name, direct]) => ({ name, direct, children: [] }));

  return { featured, groups };
}

/**
 * @param {object} entry
 * @returns {string}
 */
export const VIEWER_ZOOM_MIN = 0.5;
export const VIEWER_ZOOM_MAX = 6;

/**
 * Keep viewer magnification inside the supported range.
 *
 * @param {number} scale
 * @returns {number}
 */
export function clampViewerZoom(scale) {
  if (!Number.isFinite(scale)) return 1;
  return Math.min(VIEWER_ZOOM_MAX, Math.max(VIEWER_ZOOM_MIN, scale));
}

/**
 * Zoom around a pointer, keeping that point visually fixed.
 *
 * @param {{ scale: number, x: number, y: number }} current
 * @param {{ clientX: number, clientY: number, left: number, top: number, width: number, height: number, factor: number }} pointer
 * @returns {{ scale: number, x: number, y: number }}
 */
export function zoomViewerAt(current, pointer) {
  const next = clampViewerZoom(current.scale * pointer.factor);
  const originX = pointer.clientX - pointer.left - pointer.width / 2;
  const originY = pointer.clientY - pointer.top - pointer.height / 2;
  const ratio = current.scale === 0 ? 1 : next / current.scale;
  return {
    scale: next,
    x: originX - ratio * (originX - current.x),
    y: originY - ratio * (originY - current.y)
  };
}

export function renderResourceRow(entry) {
  const downloadUrl = encodeURI(entry.url);
  const previewUrl = entry.previewUrl || '';
  const badge = [
    entry.isNew ? '<span class="resource-tree__new" aria-label="New"><span class="tag-dot" aria-hidden="true"></span><span class="tag-text">New</span></span>' : '',
    entry.featured ? '<span class="resource-tree__featured" aria-label="Featured"><span class="tag-dot" aria-hidden="true"></span><span class="tag-text">Featured</span></span>' : ''
  ].join('');
  const dateLabel = entry.documentDateLabel || 'Date not stated on the file';
  const sizeLabel = formatBytes(entry.bytes);
  const canView = entry.format === 'PNG' || entry.format === 'PDF';
  const thumb = previewUrl
    ? `<img class="resource-tree__thumb" src="${escapeHtml(previewUrl)}" alt="${escapeHtml(entry.alt || entry.title)}" width="${Number(entry.previewWidth) || 480}" height="${Number(entry.previewHeight) || 640}" loading="lazy" decoding="async" fetchpriority="low">`
    : '';

  return `
    <div class="resource-tree__row" data-resource-id="${escapeHtml(entry.id)}" data-format="${escapeHtml(entry.format)}" data-filename="${escapeHtml(entry.originalFilename)}" data-preview-kind="${escapeHtml(entry.previewKind || '')}" data-sha256="${escapeHtml(entry.sha256 || '')}">
      <div class="resource-tree__file">
        ${thumb}
        <span class="resource-tree__file-icon" aria-hidden="true"><i data-lucide="file-text" class="shrink-0 w-4 h-4"></i></span>
        <span class="resource-tree__file-copy">
          <span class="resource-tree__file-name" title="${escapeHtml(entry.title)}">${escapeHtml(entry.title)}</span>
          <span class="resource-tree__file-filename" title="${escapeHtml(entry.originalFilename)}">${escapeHtml(entry.originalFilename)}</span>
          <span class="resource-tree__file-desc" title="${escapeHtml(entry.description)}">${escapeHtml(entry.description)}</span>
          <span class="resource-tree__file-date"><span class="resource-tree__format">${escapeHtml(entry.format)}</span>${sizeLabel ? ` · ${escapeHtml(sizeLabel)}` : ''} · ${escapeHtml(dateLabel)}</span>
        </span>
      </div>
      <span class="resource-tree__meta">${badge}<span class="resource-tree__type">${escapeHtml(entry.format)}</span></span>
      <span class="resource-tree__meta">
        ${canView ? `<button type="button" class="resource-tree__download resource-tree__preview-button" data-resource-view="${escapeHtml(entry.id)}" aria-label="View ${escapeHtml(entry.title)}" title="View ${escapeHtml(entry.format === 'PDF' ? 'PDF' : 'infographic')}">View</button>` : ''}
        <button type="button" class="resource-tree__download resource-tree__info" data-resource-info="${escapeHtml(entry.id)}" aria-expanded="false" aria-label="View details for ${escapeHtml(entry.title)}" title="View details">
          <i data-lucide="info" class="shrink-0 w-4 h-4"></i>
        </button>
        <a href="${escapeHtml(downloadUrl)}" download="${escapeHtml(entry.originalFilename)}" class="resource-tree__download" aria-label="Download ${escapeHtml(entry.title)} (${escapeHtml(entry.format)}, ${escapeHtml(entry.originalFilename)})" title="Download ${escapeHtml(entry.title)}">
          <i data-lucide="download" class="shrink-0 w-4 h-4"></i>
        </a>
      </span>
    </div>
  `;
}

/**
 * @param {object} entry
 * @returns {string[]}
 */
export function organisationsFor(entry) {
  if (Array.isArray(entry.organizations) && entry.organizations.length) return entry.organizations;
  const searchable = `${entry.title} ${entry.description} ${entry.originalFilename} ${entry.url}`.toLowerCase();
  return ORGANIZATION_RULES
    .filter((rule) => rule.terms.some((term) => searchable.includes(term)))
    .map((rule) => rule.name);
}

/**
 * @param {object} entry
 * @returns {string[]}
 */
export function topicsFor(entry) {
  if (Array.isArray(entry.topics) && entry.topics.length) return entry.topics;
  const searchable = `${entry.title} ${entry.description} ${entry.originalFilename} ${entry.url}`.toLowerCase();
  return TOPIC_RULES
    .filter((rule) => rule.terms.some((term) => searchable.includes(term)))
    .map((rule) => rule.name);
}
