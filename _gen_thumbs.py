from __future__ import annotations

import argparse
import struct
import sys
from pathlib import Path

import fitz


ROOT = Path(__file__).resolve().parent
DEFAULT_SRC = ROOT / "assets" / "downloads" / "docs"
DEFAULT_DST = ROOT / "assets" / "images" / "resource-previews"
DEFAULT_WIDTH = 600


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate PNG previews from the first page of PDF resources."
    )
    parser.add_argument(
        "filenames",
        nargs="*",
        help="Specific PDF filenames to render. Defaults to scanning the docs folder.",
    )
    parser.add_argument(
        "--src",
        type=Path,
        default=DEFAULT_SRC,
        help="Source directory containing PDF documents.",
    )
    parser.add_argument(
        "--dst",
        type=Path,
        default=DEFAULT_DST,
        help="Destination directory for generated preview PNGs.",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Regenerate every preview, even if it already exists and is current.",
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Only print warnings and the final summary.",
    )
    return parser.parse_args()


def detect_target_width(previews_dir: Path) -> int:
    for preview_path in sorted(previews_dir.glob("*.pdf.png")):
        with preview_path.open("rb") as handle:
            handle.read(16)
            return struct.unpack(">I", handle.read(4))[0]
    return DEFAULT_WIDTH


def iter_pdf_paths(src_dir: Path, filenames: list[str]) -> list[Path]:
    if filenames:
        return [src_dir / name for name in filenames]
    return sorted(path for path in src_dir.iterdir() if path.suffix.lower() == ".pdf")


def should_render(pdf_path: Path, preview_path: Path, force_all: bool) -> bool:
    if force_all or not preview_path.exists():
        return True
    return pdf_path.stat().st_mtime > preview_path.stat().st_mtime


def render_preview(pdf_path: Path, preview_path: Path, target_width: int) -> tuple[int, int]:
    with fitz.open(pdf_path) as document:
        page = document[0]
        zoom = target_width / page.rect.width
        pixmap = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
        pixmap.save(preview_path)
        return pixmap.width, pixmap.height


def main() -> int:
    args = parse_args()
    src_dir = args.src.resolve()
    dst_dir = args.dst.resolve()

    if not src_dir.exists():
        print(f"Source directory does not exist: {src_dir}", file=sys.stderr)
        return 1

    dst_dir.mkdir(parents=True, exist_ok=True)
    target_width = detect_target_width(dst_dir)
    pdf_paths = iter_pdf_paths(src_dir, args.filenames)

    created = 0
    updated = 0
    skipped = 0
    missing = 0

    if not args.quiet:
        print(f"Using preview width: {target_width}px")

    for pdf_path in pdf_paths:
        if not pdf_path.exists():
            missing += 1
            print(f"MISSING: {pdf_path}", file=sys.stderr)
            continue

        preview_path = dst_dir / f"{pdf_path.name}.png"
        existed_before = preview_path.exists()

        if not should_render(pdf_path, preview_path, args.all):
            skipped += 1
            continue

        width, height = render_preview(pdf_path, preview_path, target_width)
        if existed_before:
            updated += 1
        else:
            created += 1

        if not args.quiet:
            print(f"OK  {preview_path}  ({width}x{height})")

    print(
        f"Preview sync complete. created={created} updated={updated} skipped={skipped} missing={missing}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
