import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { PDFDocument } from "pdf-lib";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PYTHON_SCRIPT = path.join(__dirname, "..", "scripts", "pdf_compress.py");

export async function compressPdfDocument(inputBytes, { targetBytes } = {}) {
  if (!Number.isFinite(targetBytes) || targetBytes <= 0) {
    throw new Error("A valid target size is required.");
  }

  if (inputBytes.byteLength <= targetBytes) {
    return {
      bytes: inputBytes,
      strategy: "original",
      notes: ["already below target", "returned original file for maximum quality"]
    };
  }

  const normalizedBytes = await normalizePdf(inputBytes);
  if (normalizedBytes.byteLength <= targetBytes) {
    return {
      bytes: normalizedBytes,
      strategy: "normalized",
      notes: [
        "metadata cleanup",
        "structural normalization",
        `reduced by ${formatCompressionDelta(inputBytes.byteLength, normalizedBytes.byteLength)}`
      ]
    };
  }

  let bestCandidate = {
    bytes: normalizedBytes,
    strategy: "normalized",
    notes: ["metadata cleanup", "structural normalization", "target not reached with non-raster pass"]
  };

  try {
    const pythonResult = await compressWithPython(inputBytes, targetBytes);
    if (pythonResult.bytes.byteLength < bestCandidate.bytes.byteLength) {
      bestCandidate = {
        bytes: pythonResult.bytes,
        strategy: pythonResult.strategy,
        notes: pythonResult.notes
      };
    }
  } catch (error) {
    bestCandidate.notes = [
      ...bestCandidate.notes,
      `python fallback unavailable: ${error instanceof Error ? error.message : "unknown error"}`
    ];
  }

  if (bestCandidate.bytes.byteLength <= targetBytes) {
    return {
      bytes: bestCandidate.bytes,
      strategy: bestCandidate.strategy,
      notes: [
        ...bestCandidate.notes,
        `reduced by ${formatCompressionDelta(inputBytes.byteLength, bestCandidate.bytes.byteLength)}`
      ]
    };
  }

  return {
    bytes: bestCandidate.bytes,
    strategy: bestCandidate.strategy,
    notes: [
      ...bestCandidate.notes,
      `best effort output is ${formatBytes(bestCandidate.bytes.byteLength)}`,
      "target could not be reached without stronger compression"
    ]
  };
}

async function normalizePdf(inputBytes) {
  let workingBytes = inputBytes;

  for (let pass = 0; pass < 2; pass += 1) {
    const sourceDocument = await PDFDocument.load(workingBytes, {
      ignoreEncryption: true,
      updateMetadata: false
    });

    clearDocumentMetadata(sourceDocument);

    const nextDocument = await PDFDocument.create();
    const copiedPages = await nextDocument.copyPages(sourceDocument, sourceDocument.getPageIndices());
    copiedPages.forEach((page) => nextDocument.addPage(page));
    clearDocumentMetadata(nextDocument);

    workingBytes = await nextDocument.save({
      useObjectStreams: true,
      addDefaultPage: false,
      updateFieldAppearances: false,
      objectsPerTick: 50
    });
  }

  return workingBytes;
}

async function compressWithPython(inputBytes, targetBytes) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "media-resizer-"));
  const inputPath = path.join(tempDir, "input.pdf");
  const outputPath = path.join(tempDir, "output.pdf");

  try {
    await fs.writeFile(inputPath, inputBytes);
    const { stdout, stderr } = await execFileAsync(
      "python",
      [PYTHON_SCRIPT, inputPath, outputPath, String(targetBytes)],
      { timeout: 120000, maxBuffer: 1024 * 1024 * 4 }
    );

    if (stderr?.trim()) {
      throw new Error(stderr.trim());
    }

    const metadata = JSON.parse(stdout.trim() || "{}");
    const bytes = await fs.readFile(outputPath);

    return {
      bytes: new Uint8Array(bytes),
      strategy: metadata.strategy || "python-fallback",
      notes: Array.isArray(metadata.notes) ? metadata.notes : ["python fallback compression"]
    };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

function clearDocumentMetadata(document) {
  document.setTitle("");
  document.setAuthor("");
  document.setSubject("");
  document.setKeywords([]);
  document.setCreator("");
  document.setProducer("");
  document.setLanguage("");
}

function formatCompressionDelta(originalBytes, nextBytes) {
  const saved = originalBytes - nextBytes;
  const ratio = (saved / originalBytes) * 100;
  return `${ratio.toFixed(1)}% (${formatBytes(saved)} saved)`;
}

export function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
