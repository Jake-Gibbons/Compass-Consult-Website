"""Render the first page of a PDF to a PNG. Does not modify the PDF."""

from __future__ import annotations

import sys
from pathlib import Path

import fitz


def main() -> int:
    if len(sys.argv) != 4:
        print("usage: render-pdf-preview.py INPUT.pdf OUTPUT.png WIDTH", file=sys.stderr)
        return 2
    source = Path(sys.argv[1])
    destination = Path(sys.argv[2])
    width = int(sys.argv[3])
    destination.parent.mkdir(parents=True, exist_ok=True)
    with fitz.open(source) as document:
        page = document[0]
        zoom = width / page.rect.width
        pixmap = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
        pixmap.save(destination)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
