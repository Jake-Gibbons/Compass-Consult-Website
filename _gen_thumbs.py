import fitz, os, struct

src = "assets/downloads/docs"
dst = "assets/images/resource-previews"
new_files = [
    "CCES Local Government Reorganisation update 25 March 2026.pdf",
    "CCES Overview of Spring Statement 3rd March 2026.pdf",
    "CCES Youth Guarantee Trailblazer Briefing 18.03.26.pdf",
]

# Match width of existing thumbnails
target_w = 600
existing = [f for f in os.listdir(dst) if f.endswith(".pdf.png")]
if existing:
    with open(os.path.join(dst, existing[0]), "rb") as f:
        f.read(16)  # skip PNG signature + IHDR tag
        w = struct.unpack(">I", f.read(4))[0]
    target_w = w
    print(f"Matching existing thumbnail width: {target_w}px")

for filename in new_files:
    pdf_path = os.path.join(src, filename)
    out_path = os.path.join(dst, filename + ".png")
    if not os.path.exists(pdf_path):
        print(f"MISSING: {pdf_path}")
        continue
    doc = fitz.open(pdf_path)
    page = doc[0]
    zoom = target_w / page.rect.width
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat, alpha=False)
    pix.save(out_path)
    print(f"OK  {out_path}  ({pix.width}x{pix.height})")
    doc.close()

print("Done.")
