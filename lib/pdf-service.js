import { PDFDocument } from "pdf-lib";

const MODE_PROFILES = {
  preserve: {
    duplicatePasses: 1,
    notes: ["metadata cleanup", "structural normalization"]
  },
  balanced: {
    duplicatePasses: 2,
    notes: ["metadata cleanup", "object stream rewrite", "balanced save profile"]
  },
  maximum: {
    duplicatePasses: 3,
    notes: ["metadata cleanup", "object stream rewrite", "aggressive multi-pass save"]
  }
};

export async function compressPdfDocument(inputBytes, { mode = "balanced" } = {}) {
  const selectedMode = MODE_PROFILES[mode] ? mode : "balanced";
  let workingBytes = inputBytes;

  for (let pass = 0; pass < MODE_PROFILES[selectedMode].duplicatePasses; pass += 1) {
    const sourceDocument = await PDFDocument.load(workingBytes, {
      ignoreEncryption: true,
      updateMetadata: false
    });

    clearDocumentMetadata(sourceDocument);

    const nextDocument = await PDFDocument.create();
    const pageIndices = sourceDocument.getPageIndices();
    const copiedPages = await nextDocument.copyPages(sourceDocument, pageIndices);

    copiedPages.forEach((page) => {
      nextDocument.addPage(page);
    });

    clearDocumentMetadata(nextDocument);

    workingBytes = await nextDocument.save({
      useObjectStreams: true,
      addDefaultPage: false,
      updateFieldAppearances: false,
      objectsPerTick: selectedMode === "maximum" ? 25 : 50
    });
  }

  return {
    bytes: workingBytes,
    mode: selectedMode,
    notes: MODE_PROFILES[selectedMode].notes
  };
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

export function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
