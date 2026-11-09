# Resource library

The resource library is one directory, `assets/resources/`. It is a copy of the supplied OneDrive folder. Category names and filenames are unchanged. Marketing is not part of this directory, and `assets/images/infographics/Marketing/` is untouched.

The webpage lists this folder tree. It does not split the same files into separate Files and Infographics directories.

`assets/resources/_previews/` holds lightweight WebP thumbnails so the page does not download every original up front. Those previews are not listed as library files.

The Staying Close Word guide is in both Education & Skills and Government & Devolution, matching the supplied folder. The two copies are the same file.

PDF thumbnails are the first page. DOCX and PPTX use a format label, not a page or slide preview. PNG rows can open the original image.

Previous public URLs redirect to the new paths. The rules are marked in `netlify.toml`.

## Counts

| | |
|---|---|
| Files in the folder | 86 |
| Unique files | 85 |
| Top-level categories | 8 |

## Folder tree

```
assets/resources/
├── Education & Skills/
├── Employment Policy & Employability/
│   └── Future Employment Support/
├── Governance & Project Management/
├── Government & Devolution/
├── Health & Social Care/
├── Housing/
├── Institute of Employability Professionals/
└── Leadership & Management/
```

## Adding a file

Put the original in the matching category under `assets/resources/`, using the filename you want visitors to see. Run `npm run sync:resources`. Then check the title and description in `data/resource-library.json`. Do not add Marketing files.
