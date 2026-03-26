"use client";

import { useMemo, useState } from "react";
import { Dropzone } from "@/components/dropzone";

const targetOptions = [
  { label: "Under 500 KB", value: 512000, description: "Tight shareable file size." },
  { label: "Under 1 MB", value: 1048576, description: "Best general-purpose preset." },
  { label: "Under 2 MB", value: 2097152, description: "Higher quality, still reduced." },
  { label: "Under 5 MB", value: 5242880, description: "Light compression, larger allowance." }
];

export function PdfCompressor() {
  const [file, setFile] = useState(null);
  const [targetBytes, setTargetBytes] = useState(targetOptions[1].value);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [lastResult, setLastResult] = useState(null);

  const selectedTarget = useMemo(
    () => targetOptions.find((option) => option.value === targetBytes) ?? targetOptions[1],
    [targetBytes]
  );

  function handleFileSelect(nextFile) {
    if (nextFile.type !== "application/pdf") {
      setError("Please choose a PDF file.");
      return;
    }

    setFile(nextFile);
    setError("");
    setStatus("");
    setLastResult(null);
  }

  async function handleCompress() {
    if (!file) {
      setError("Choose a PDF before starting compression.");
      return;
    }

    try {
      setError("");
      setLastResult(null);
      setStatus("Uploading PDF...");

      const apiBaseUrl = resolvePdfApiBaseUrl();
      if (!apiBaseUrl) {
        throw new Error("PDF backend is not configured. Set NEXT_PUBLIC_PDF_API_URL.");
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("targetBytes", String(targetBytes));

      const createResponse = await fetch(`${apiBaseUrl}/jobs`, {
        method: "POST",
        body: formData
      });

      const createdJob = await readJsonResponse(createResponse, "Could not start PDF compression.");
      const jobId = createdJob.jobId;

      if (!jobId) {
        throw new Error("The PDF service did not return a job id.");
      }

      setStatus("Compressing PDF in the background...");
      const finishedJob = await pollJob(apiBaseUrl, jobId, setStatus);

      if (finishedJob.status !== "completed" || !finishedJob.result) {
        throw new Error(finishedJob.error || "Compression did not finish successfully.");
      }

      setStatus("Preparing download...");
      const downloadResponse = await fetch(`${apiBaseUrl}${finishedJob.result.downloadUrl}`);
      if (!downloadResponse.ok) {
        const payload = await downloadResponse.json().catch(() => ({}));
        throw new Error(payload.error || "Could not download compressed PDF.");
      }

      const blob = await downloadResponse.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const strategy = downloadResponse.headers.get("X-Compression-Strategy") || finishedJob.result.strategy;
      const notes =
        (downloadResponse.headers.get("X-Compression-Notes") || "").split(" | ").filter(Boolean) ||
        finishedJob.result.notes ||
        [];

      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = `${file.name.replace(/\.pdf$/i, "")}-${sanitizeLabel(selectedTarget.label)}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(downloadUrl);

      setLastResult({
        originalSize: formatBytes(finishedJob.result.originalSize ?? file.size),
        outputSize: formatBytes(finishedJob.result.outputSize ?? blob.size),
        targetSize: formatBytes(finishedJob.result.targetSize ?? targetBytes),
        strategy,
        notes
      });
      setStatus("Compressed PDF downloaded.");
    } catch (nextError) {
      setStatus("");
      setError(nextError instanceof Error ? nextError.message : "Compression failed.");
    }
  }

  function reset() {
    setFile(null);
    setTargetBytes(targetOptions[1].value);
    setStatus("");
    setError("");
    setLastResult(null);
  }

  return (
    <section className="glass-panel tool-card">
      <div className="section-heading">
        <p className="eyebrow">PDF Lab</p>
        <h2>Compress to a target size, not more than necessary</h2>
      </div>

      {!file ? (
        <Dropzone
          accept="application/pdf"
          title="Drop a PDF into the lab"
          subtitle="Pick the maximum size you can tolerate and the service will stop at the highest quality under that limit."
          buttonLabel="Select PDF"
          onFileSelect={handleFileSelect}
        />
      ) : (
        <>
          <div className="info-grid">
            <div className="info-tile">
              <span className="info-label">File</span>
              <strong>{file.name}</strong>
            </div>
            <div className="info-tile">
              <span className="info-label">Original size</span>
              <strong>{formatBytes(file.size)}</strong>
            </div>
            <div className="info-tile">
              <span className="info-label">Target</span>
              <strong>{selectedTarget.label}</strong>
            </div>
          </div>

          <div className="mode-grid">
            {targetOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={option.value === targetBytes ? "mode-card is-active" : "mode-card"}
                onClick={() => setTargetBytes(option.value)}
              >
                <strong>{option.label}</strong>
                <span>{option.description}</span>
              </button>
            ))}
          </div>

          <div className="callout">
            <strong>{selectedTarget.label}</strong>
            <p>{selectedTarget.description}</p>
          </div>

          <div className="button-row">
            <button type="button" className="cta-primary" onClick={handleCompress}>
              Compress PDF
            </button>
            <button type="button" className="cta-secondary" onClick={reset}>
              Start over
            </button>
          </div>

          {lastResult ? (
            <div className="result-card pdf-result-card">
              <div>
                <span className="info-label">Original</span>
                <strong>{lastResult.originalSize}</strong>
              </div>
              <div>
                <span className="info-label">Target</span>
                <strong>{lastResult.targetSize}</strong>
              </div>
              <div>
                <span className="info-label">Output</span>
                <strong>{lastResult.outputSize}</strong>
              </div>
              <div>
                <span className="info-label">Strategy</span>
                <strong>{lastResult.strategy}</strong>
              </div>
              <div className="result-span">
                <span className="info-label">Service notes</span>
                <strong>{lastResult.notes.join(", ") || "Compression completed."}</strong>
              </div>
            </div>
          ) : null}
        </>
      )}

      {status ? <p className="status-message">{status}</p> : null}
      {error ? <p className="error-message">{error}</p> : null}
    </section>
  );
}

async function pollJob(apiBaseUrl, jobId, setStatus) {
  const timeoutAt = Date.now() + 10 * 60 * 1000;

  while (Date.now() < timeoutAt) {
    await wait(2000);
    const response = await fetch(`${apiBaseUrl}/jobs/${jobId}`);
    const job = await readJsonResponse(response, "Could not read PDF compression status.");

    if (job.status === "completed" || job.status === "failed") {
      return job;
    }

    setStatus("Compressing PDF in the background...");
  }

  throw new Error("Compression is taking too long. Please try again.");
}

async function readJsonResponse(response, fallbackMessage) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || fallbackMessage);
  }
  return payload;
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function sanitizeLabel(label) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function resolvePdfApiBaseUrl() {
  const rawValue = process.env.NEXT_PUBLIC_PDF_API_URL;
  return rawValue ? rawValue.replace(/\/+$/, "") : "";
}
