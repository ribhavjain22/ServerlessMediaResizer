import gc
import json
import os
import shutil
import sys
import tempfile

import fitz
from PIL import Image


MAX_RASTER_PAGES = 24


def file_size(path):
    return os.path.getsize(path)


def normalize_pdf(input_path, output_path):
    doc = fitz.open(input_path)
    try:
        doc.save(output_path, garbage=4, deflate=True)
    finally:
        doc.close()


def rasterize_pdf(input_path, output_path, profile):
    source = fitz.open(input_path)
    output = fitz.open()

    try:
        for page in source:
            pix = page.get_pixmap(dpi=profile["dpi"], alpha=False)
            new_page = output.new_page(width=page.rect.width, height=page.rect.height)

            if profile["format"] == "png":
                image_bytes = pix.tobytes("png")
            else:
                image = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                with tempfile.SpooledTemporaryFile() as buffer:
                    image.save(buffer, format="JPEG", quality=profile["quality"], optimize=True)
                    buffer.seek(0)
                    image_bytes = buffer.read()
                image.close()

            new_page.insert_image(page.rect, stream=image_bytes)

            del image_bytes
            del new_page
            del pix
            gc.collect()

        output.save(output_path, garbage=4, deflate=True)
    finally:
        output.close()
        source.close()
        gc.collect()


def choose_best(input_path, target_bytes, output_path=None):
    work_dir = tempfile.mkdtemp(prefix="pdf-compress-")

    try:
        normalized_path = os.path.join(work_dir, "normalized.pdf")
        normalize_pdf(input_path, normalized_path)

        normalized_size = file_size(normalized_path)
        normalized_doc = fitz.open(input_path)
        try:
            page_count = normalized_doc.page_count
        finally:
            normalized_doc.close()

        if normalized_size <= target_bytes:
            metadata = {
                "strategy": "normalized",
                "notes": ["metadata cleanup", "structural normalization", "target reached without rasterization"],
            }
            selected_path = normalized_path
        elif page_count > MAX_RASTER_PAGES:
            metadata = {
                "strategy": "normalized",
                "notes": [
                    "metadata cleanup",
                    "structural normalization",
                    "raster pass skipped for large document to stay within hosted memory limits",
                    "target could not be reached safely on the current backend tier",
                ],
            }
            selected_path = normalized_path
        else:
            profiles = [
                {"dpi": 150, "format": "jpeg", "quality": 84, "label": "quality raster"},
                {"dpi": 130, "format": "jpeg", "quality": 78, "label": "balanced raster"},
                {"dpi": 110, "format": "jpeg", "quality": 70, "label": "medium raster"},
                {"dpi": 96, "format": "jpeg", "quality": 62, "label": "compressed raster"},
                {"dpi": 84, "format": "jpeg", "quality": 56, "label": "aggressive raster"},
            ]

            best_under_target = None
            best_effort_path = normalized_path
            best_effort_size = normalized_size
            best_effort_meta = {
                "strategy": "normalized",
                "notes": ["metadata cleanup", "structural normalization", "target not reached with non-raster pass"],
            }

            for index, profile in enumerate(profiles):
                attempt_path = os.path.join(work_dir, f"attempt-{index}.pdf")
                rasterize_pdf(input_path, attempt_path, profile)
                attempt_size = file_size(attempt_path)

                meta = {
                    "strategy": profile["label"],
                    "notes": [f"pages converted to {profile['format'].upper()}-backed PDF", f"used {profile['label']}"],
                }

                if attempt_size < best_effort_size:
                    best_effort_path = attempt_path
                    best_effort_size = attempt_size
                    best_effort_meta = meta

                if attempt_size <= target_bytes:
                    if not best_under_target or attempt_size > best_under_target[0]:
                        best_under_target = (attempt_size, attempt_path, meta)

            if best_under_target:
                _, selected_path, metadata = best_under_target
                metadata["notes"].append("selected the closest result under the requested target")
            else:
                selected_path = best_effort_path
                metadata = best_effort_meta
                metadata["notes"].append("target could not be reached without stronger compression")

        if output_path:
            with open(selected_path, "rb") as source, open(output_path, "wb") as dest:
                shutil.copyfileobj(source, dest)

        return metadata
    finally:
        shutil.rmtree(work_dir, ignore_errors=True)
        gc.collect()


def main():
    if len(sys.argv) != 4:
        raise SystemExit("Usage: pdf_compress.py <input> <output> <target_bytes>")

    input_path = sys.argv[1]
    output_path = sys.argv[2]
    target_bytes = int(sys.argv[3])
    metadata = choose_best(input_path, target_bytes, output_path)
    print(json.dumps(metadata))


if __name__ == "__main__":
    main()
