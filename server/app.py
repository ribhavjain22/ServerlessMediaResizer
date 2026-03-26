import shutil
import threading
import time
import traceback
import uuid
from pathlib import Path
from tempfile import gettempdir

from flask import Flask, jsonify, request, send_file
from flask_cors import CORS

from pdf_compress import choose_best


JOB_TTL_SECONDS = 60 * 60
JOB_ROOT = Path(gettempdir()) / "serverless-media-resizer-jobs"
JOB_ROOT.mkdir(parents=True, exist_ok=True)

app = Flask(__name__)
CORS(app)

jobs = {}
jobs_lock = threading.Lock()


def build_job_paths(job_id):
    job_dir = JOB_ROOT / job_id
    return {
        "dir": job_dir,
        "input": job_dir / "input.pdf",
        "output": job_dir / "output.pdf",
    }


def cleanup_expired_jobs():
    cutoff = time.time() - JOB_TTL_SECONDS

    with jobs_lock:
        expired_ids = [
            job_id
            for job_id, job in jobs.items()
            if job.get("updated_at", job["created_at"]) < cutoff and job["status"] != "processing"
        ]

        for job_id in expired_ids:
            job = jobs.pop(job_id, None)
            if job:
                shutil.rmtree(job["job_dir"], ignore_errors=True)


def update_job(job_id, **fields):
    with jobs_lock:
        job = jobs[job_id]
        job.update(fields)
        job["updated_at"] = time.time()


def process_job(job_id):
    with jobs_lock:
        job = jobs.get(job_id)

    if not job:
        return

    try:
        metadata = choose_best(str(job["input_path"]), job["target_bytes"], str(job["output_path"]))
        output_size = job["output_path"].stat().st_size
        update_job(
            job_id,
            status="completed",
            metadata=metadata,
            output_size=output_size,
        )
    except Exception as exc:
        app.logger.error("PDF compression failed for job %s:\n%s", job_id, traceback.format_exc())
        update_job(
            job_id,
            status="failed",
            error=f"PDF compression failed: {exc}",
        )


def serialize_job(job_id, job):
    payload = {
        "jobId": job_id,
        "status": job["status"],
        "createdAt": job["created_at"],
        "updatedAt": job.get("updated_at", job["created_at"]),
    }

    if job["status"] == "completed":
        payload["result"] = {
            "originalSize": job["original_size"],
            "outputSize": job["output_size"],
            "targetSize": job["target_bytes"],
            "strategy": job["metadata"]["strategy"],
            "notes": job["metadata"]["notes"],
            "downloadUrl": f"/jobs/{job_id}/download",
        }
    elif job["status"] == "failed":
        payload["error"] = job.get("error", "Compression failed.")

    return payload


@app.get("/health")
def health():
    return jsonify({"status": "ok", "service": "pdf-compressor"})


@app.post("/jobs")
def create_job():
    cleanup_expired_jobs()

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

    job_id = uuid.uuid4().hex
    paths = build_job_paths(job_id)
    paths["dir"].mkdir(parents=True, exist_ok=True)
    uploaded_file.save(paths["input"])

    job = {
        "status": "processing",
        "created_at": time.time(),
        "updated_at": time.time(),
        "job_dir": paths["dir"],
        "input_path": paths["input"],
        "output_path": paths["output"],
        "target_bytes": target_bytes,
        "original_size": paths["input"].stat().st_size,
        "metadata": None,
        "error": None,
        "output_size": None,
        "filename_stem": Path(uploaded_file.filename or "document.pdf").stem,
    }

    with jobs_lock:
        jobs[job_id] = job

    worker = threading.Thread(target=process_job, args=(job_id,), daemon=True)
    worker.start()

    response = jsonify(serialize_job(job_id, job))
    response.status_code = 202
    return response


@app.get("/jobs/<job_id>")
def get_job(job_id):
    cleanup_expired_jobs()

    with jobs_lock:
        job = jobs.get(job_id)

    if not job:
        return jsonify({"error": "Job not found or expired."}), 404

    return jsonify(serialize_job(job_id, job))


@app.get("/jobs/<job_id>/download")
def download_job(job_id):
    cleanup_expired_jobs()

    with jobs_lock:
        job = jobs.get(job_id)

    if not job:
        return jsonify({"error": "Job not found or expired."}), 404

    if job["status"] != "completed":
        return jsonify({"error": "Job is not ready yet."}), 409

    response = send_file(
        job["output_path"],
        mimetype="application/pdf",
        as_attachment=True,
        download_name=f"{job['filename_stem']}-compressed.pdf",
    )
    response.headers["X-Compression-Strategy"] = job["metadata"]["strategy"]
    response.headers["X-Compression-Notes"] = " | ".join(job["metadata"]["notes"])
    response.headers["X-Original-Size"] = str(job["original_size"])
    response.headers["X-Output-Size"] = str(job["output_size"])
    response.headers["X-Target-Size"] = str(job["target_bytes"])
    return response


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000, debug=True)
