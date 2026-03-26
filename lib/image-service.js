export async function createImageSource(file) {
  const dataUrl = await readFileAsDataUrl(file);
  const dimensions = await loadImageDimensions(dataUrl);

  return {
    file,
    name: file.name,
    size: file.size,
    dataUrl,
    ...dimensions
  };
}

export async function resizeImageToResolution(file, resolution, quality = 0.92) {
  validateResolution(resolution);
  const image = await loadImage(await readFileAsDataUrl(file));
  const canvas = document.createElement("canvas");
  canvas.width = resolution.width;
  canvas.height = resolution.height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas context is unavailable.");
  }

  context.drawImage(image, 0, 0, resolution.width, resolution.height);
  return canvas.toDataURL("image/jpeg", quality);
}

export async function reduceImageToTargetSize(file, targetBytes) {
  if (file.size <= targetBytes) {
    return {
      blob: file,
      extension: getExtensionFromMime(file.type, file.name),
      mime: file.type || "application/octet-stream"
    };
  }

  const image = await loadImage(await readFileAsDataUrl(file));
  const minimumResolution = { width: 50, height: 50 };
  const dimensionScales = [1, 0.99, 0.98, 0.97, 0.96, 0.95, 0.94, 0.92, 0.9, 0.88, 0.85, 0.82, 0.78, 0.74, 0.7];
  const formatCandidates = getFormatCandidates(file.type);
  let bestUnderTarget = null;
  let smallestAttempt = null;

  for (const scale of dimensionScales) {
    const width = Math.max(Math.round(image.width * scale), minimumResolution.width);
    const height = Math.max(Math.round(image.height * scale), minimumResolution.height);

    if (width < minimumResolution.width || height < minimumResolution.height) {
      continue;
    }

    for (const candidate of formatCandidates) {
      for (const quality of candidate.qualities) {
        const blob = await renderImageBlob(image, { width, height }, candidate.mime, quality);
        const attempt = {
          blob,
          bytes: blob.size,
          mime: candidate.mime,
          extension: candidate.extension
        };

        if (!smallestAttempt || attempt.bytes < smallestAttempt.bytes) {
          smallestAttempt = attempt;
        }

        if (attempt.bytes <= targetBytes) {
          if (!bestUnderTarget || attempt.bytes > bestUnderTarget.bytes) {
            bestUnderTarget = attempt;
          }
        }
      }
    }

    if (bestUnderTarget) {
      break;
    }
  }

  if (bestUnderTarget) {
    return bestUnderTarget;
  }

  if (smallestAttempt) {
    return smallestAttempt;
  }

  throw new Error("Unable to reduce the image to the requested size.");
}

export function calculateScaledResolution(currentResolution, targetWidth, targetHeight) {
  const aspectRatio = currentResolution.width / currentResolution.height;

  if (targetWidth && !targetHeight) {
    return { width: targetWidth, height: Math.round(targetWidth / aspectRatio) };
  }

  if (!targetWidth && targetHeight) {
    return { width: Math.round(targetHeight * aspectRatio), height: targetHeight };
  }

  if (targetWidth && targetHeight) {
    return { width: targetWidth, height: targetHeight };
  }

  throw new Error("A target width or height is required.");
}

async function renderImageBlob(image, resolution, mime, quality) {
  validateResolution(resolution);
  const canvas = document.createElement("canvas");
  canvas.width = resolution.width;
  canvas.height = resolution.height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas context is unavailable.");
  }

  context.drawImage(image, 0, 0, resolution.width, resolution.height);
  return canvasToBlob(canvas, mime, quality);
}

function getFormatCandidates(inputMime) {
  if (inputMime === "image/png") {
    return [
      { mime: "image/png", extension: "png", qualities: [undefined] },
      { mime: "image/webp", extension: "webp", qualities: [0.99, 0.97, 0.95, 0.92, 0.88, 0.84, 0.8] },
      { mime: "image/jpeg", extension: "jpg", qualities: [0.98, 0.96, 0.94, 0.92, 0.9, 0.88] }
    ];
  }

  if (inputMime === "image/webp") {
    return [
      { mime: "image/webp", extension: "webp", qualities: [0.99, 0.97, 0.95, 0.92, 0.88, 0.84, 0.8, 0.76] },
      { mime: "image/jpeg", extension: "jpg", qualities: [0.98, 0.96, 0.94, 0.92, 0.9, 0.88] }
    ];
  }

  return [
    { mime: "image/jpeg", extension: "jpg", qualities: [0.99, 0.97, 0.95, 0.93, 0.9, 0.87, 0.84, 0.8, 0.76] },
    { mime: "image/webp", extension: "webp", qualities: [0.99, 0.97, 0.95, 0.92, 0.88, 0.84, 0.8] }
  ];
}

function canvasToBlob(canvas, mime, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Image encoding failed."));
          return;
        }
        resolve(blob);
      },
      mime,
      quality
    );
  });
}

function getExtensionFromMime(mime, fileName = "image") {
  const extensionMap = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif"
  };

  return extensionMap[mime] || fileName.split(".").pop() || "img";
}

function validateResolution(resolution) {
  if (!Number.isInteger(resolution.width) || !Number.isInteger(resolution.height)) {
    throw new Error("Width and height must be whole numbers.");
  }

  if (resolution.width <= 0 || resolution.height <= 0) {
    throw new Error("Width and height must be greater than zero.");
  }

  if (resolution.width * resolution.height > 25600000) {
    throw new Error("The product of width and height must not exceed 25,600,000.");
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read the image file."));
    reader.readAsDataURL(file);
  });
}

function loadImageDimensions(dataUrl) {
  return loadImage(dataUrl).then((image) => ({
    width: image.width,
    height: image.height
  }));
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not decode the image."));
    image.src = source;
  });
}
