"use client";

import { useState } from "react";
import { Dropzone } from "@/components/dropzone";
import {
  calculateScaledResolution,
  createImageSource,
  reduceImageToTargetSize,
  resizeImageToResolution
} from "@/lib/image-service";

const presetTargets = [
  { label: "500 KB", value: 512000 },
  { label: "1 MB", value: 1048576 },
  { label: "2 MB", value: 2097152 },
  { label: "3 MB", value: 3145728 }
];

export function ImageConverter() {
  const [imageState, setImageState] = useState(null);
  const [targetWidth, setTargetWidth] = useState("");
  const [targetHeight, setTargetHeight] = useState("");
  const [keepAspectRatio, setKeepAspectRatio] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  async function loadFile(file) {
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    try {
      setError("");
      setStatus("Loading image...");
      const nextState = await createImageSource(file);
      setImageState(nextState);
      setTargetWidth(String(nextState.width));
      setTargetHeight(String(nextState.height));
      setStatus("");
    } catch (nextError) {
      setStatus("");
      setError(nextError instanceof Error ? nextError.message : "Image loading failed.");
    }
  }

  function reset() {
    setImageState(null);
    setTargetWidth("");
    setTargetHeight("");
    setKeepAspectRatio(true);
    setError("");
    setStatus("");
  }

  function downloadDataUrl(dataUrl, fileName) {
    const anchor = document.createElement("a");
    anchor.href = dataUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }

  function downloadBlob(blob, fileName) {
    const downloadUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(downloadUrl);
  }

  function handleWidthChange(value) {
    setTargetWidth(value);
    if (!keepAspectRatio || !imageState || !value) {
      return;
    }

    const scaled = calculateScaledResolution(
      { width: imageState.width, height: imageState.height },
      Number.parseInt(value, 10),
      undefined
    );
    setTargetHeight(String(scaled.height));
  }

  function handleHeightChange(value) {
    setTargetHeight(value);
    if (!keepAspectRatio || !imageState || !value) {
      return;
    }

    const scaled = calculateScaledResolution(
      { width: imageState.width, height: imageState.height },
      undefined,
      Number.parseInt(value, 10)
    );
    setTargetWidth(String(scaled.width));
  }

  async function handleResize() {
    if (!imageState) {
      return;
    }

    try {
      setError("");
      setStatus("Rendering resized image...");
      const resized = await resizeImageToResolution(imageState.file, {
        width: Number.parseInt(targetWidth, 10),
        height: Number.parseInt(targetHeight, 10)
      });
      downloadDataUrl(resized, `${stripExtension(imageState.name)}-resized.jpg`);
      setStatus("Resized image downloaded.");
    } catch (nextError) {
      setStatus("");
      setError(nextError instanceof Error ? nextError.message : "Resize failed.");
    }
  }

  async function handleReduce(targetBytes) {
    if (!imageState) {
      return;
    }

    try {
      setError("");
      setStatus("Reducing image size...");
      const reduced = await reduceImageToTargetSize(imageState.file, targetBytes);
      downloadBlob(reduced.blob, `${stripExtension(imageState.name)}-${targetBytes}.${reduced.extension}`);
      setStatus("Reduced image downloaded.");
    } catch (nextError) {
      setStatus("");
      setError(nextError instanceof Error ? nextError.message : "Could not reach the requested size.");
    }
  }

  const hasLoadedImage = Boolean(imageState);

  return (
    <section className="glass-panel tool-card">
      <div className="section-heading">
        <p className="eyebrow">Image Studio</p>
        <h2>Resize and reduce images without leaving the browser</h2>
      </div>

      {!hasLoadedImage ? (
        <Dropzone
          accept="image/*"
          title="Drop an image into the studio"
          subtitle="Everything stays local. No upload step, no server queue."
          buttonLabel="Select image"
          onFileSelect={loadFile}
        />
      ) : (
        <>
          <div className="info-grid">
            <div className="info-tile">
              <span className="info-label">File</span>
              <strong>{imageState.name}</strong>
            </div>
            <div className="info-tile">
              <span className="info-label">Dimensions</span>
              <strong>{imageState.width} x {imageState.height}</strong>
            </div>
            <div className="info-tile">
              <span className="info-label">Size</span>
              <strong>{formatMegabytes(imageState.size)}</strong>
            </div>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>Width</span>
              <input type="number" min="1" value={targetWidth} onChange={(event) => handleWidthChange(event.target.value)} />
            </label>
            <label className="field">
              <span>Height</span>
              <input type="number" min="1" value={targetHeight} onChange={(event) => handleHeightChange(event.target.value)} />
            </label>
          </div>

          <label className="toggle">
            <input
              type="checkbox"
              checked={keepAspectRatio}
              onChange={(event) => setKeepAspectRatio(event.target.checked)}
            />
            <span>Keep aspect ratio</span>
          </label>

          <div className="button-row">
            <button type="button" className="cta-primary" onClick={handleResize}>
              Resize image
            </button>
            <button type="button" className="cta-secondary" onClick={reset}>
              Start over
            </button>
          </div>

          <div className="preset-grid">
            {presetTargets.map((preset) => (
              <button
                key={preset.value}
                type="button"
                className="preset-button"
                onClick={() => handleReduce(preset.value)}
              >
                Reduce to {preset.label}
              </button>
            ))}
          </div>
        </>
      )}

      {status ? <p className="status-message">{status}</p> : null}
      {error ? <p className="error-message">{error}</p> : null}
    </section>
  );
}

function stripExtension(fileName) {
  return fileName.replace(/\.[^.]+$/, "");
}

function formatMegabytes(bytes) {
  return `${(bytes / 1048576).toFixed(2)} MB`;
}
