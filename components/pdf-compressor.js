"use client";

import { useMemo, useState } from "react";
import { Dropzone } from "@/components/dropzone";

const modeCopy = {
  preserve: {
    title: "Preserve layout",
    description: "Metadata cleanup and structural normalization with minimal visual risk."
  },
  balanced: {
    title: "Balanced",
    description: "Fresh compression pass for general sharing and storage."
  },
  maximum: {
    title: "Maximum squeeze",
    description: "Most aggressive save profile available in this rebuild."
  }
};

export function PdfCompressor() {
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState("balanced");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [lastResult, setLastResult] = useState(null);

  const selectedMode = useMemo(() => modeCopy[mode], [mode]);

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
      setStatus("Compressing PDF...");
      setLastResult(null);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", mode);

      const response = await fetch("/api/pdf/compress", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Compression request failed.");
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const outputSize = response.headers.get("X-Output-Size") || formatBytes(blob.size);
      const originalSize = response.headers.get("X-Original-Size") || formatBytes(file.size);
      const notes = (response.headers.get("X-Compression-Notes") || "")
        .split(" | ")
        .filter(Boolean);

      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = `${file.name.replace(/\.pdf$/i, "")}-${mode}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      setLastResult({
        originalSize,
        outputSize,
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
    setMode("balanced");
    setStatus("");
    setError("");
    setLastResult(null);
  }

  return (
    <section className="glass-panel tool-card">
      <div className="section-heading">
        <p className="eyebrow">PDF Lab</p>
        <h2>Fresh PDF compression service with explicit modes</h2>
      </div>

      {!file ? (
        <Dropzone
          accept="application/pdf"
          title="Drop a PDF into the lab"
          subtitle="The rebuild sends PDFs through a single Next.js service route."
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
              <span className="info-label">Mode</span>
              <strong>{selectedMode.title}</strong>
            </div>
          </div>

          <div className="mode-grid">
            {Object.entries(modeCopy).map(([key, value]) => (
              <button
                key={key}
                type="button"
                className={key === mode ? "mode-card is-active" : "mode-card"}
                onClick={() => setMode(key)}
              >
                <strong>{value.title}</strong>
                <span>{value.description}</span>
              </button>
            ))}
          </div>

          <div className="callout">
            <strong>{selectedMode.title}</strong>
            <p>{selectedMode.description}</p>
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
            <div className="result-card">
              <div>
                <span className="info-label">Original</span>
                <strong>{lastResult.originalSize}</strong>
              </div>
              <div>
                <span className="info-label">Output</span>
                <strong>{lastResult.outputSize}</strong>
              </div>
              <div>
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

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
