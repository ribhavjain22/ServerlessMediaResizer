from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from pathlib import Path
from tempfile import TemporaryDirectory

from pdf_compress import choose_best


app = Flask(__name__)
CORS(app)


@app.get("/health")
def health():
    return jsonify({"status": "ok", "service": "pdf-compressor"})


@app.post("/compress")
def compress():
    uploaded_file = request.files.get("file")
    target_bytes_raw = request.form.get("targetBytes")

    if uploaded_file is None:
        return jsonify({"error": "No PDF file uploaded."}), 400

    if uploaded_file.mimetype != "application/pdf":
        return jsonify({"error": "Only PDF uploads are supported."}), 400

    try:
        target_bytes = int(target_bytes_raw)
    except (TypeError, ValueError):
        return jsonify({"error": "A valid target size is required."}), 400

    with TemporaryDirectory(prefix="pdf-api-") as temp_dir:
        temp_path = Path(temp_dir)
        input_path = temp_path / "input.pdf"
        output_path = temp_path / "output.pdf"

        uploaded_file.save(input_path)
        metadata = choose_best(str(input_path), target_bytes, str(output_path))

        response = send_file(
            output_path,
            mimetype="application/pdf",
            as_attachment=True,
            download_name=f"{Path(uploaded_file.filename).stem}-compressed.pdf",
        )
        response.headers["X-Compression-Strategy"] = metadata["strategy"]
        response.headers["X-Compression-Notes"] = " | ".join(metadata["notes"])
        response.headers["X-Original-Size"] = str(input_path.stat().st_size)
        response.headers["X-Output-Size"] = str(output_path.stat().st_size)
        response.headers["X-Target-Size"] = str(target_bytes)
        return response


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000, debug=True)
