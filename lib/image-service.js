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
  const image = await loadImage(await readFileAsDataUrl(file));
  const minimumResolution = { width: 50, height: 50 };
  let quality = 0.92;

  while (quality >= 0.45) {
    const reductionRatio = Math.sqrt(targetBytes / Math.max(file.size, 1));
    let width = Math.max(Math.round(image.width * reductionRatio), minimumResolution.width);
    let height = Math.max(Math.round(image.height * reductionRatio), minimumResolution.height);

    while (width >= minimumResolution.width && height >= minimumResolution.height) {
      const result = renderImage(image, { width, height }, quality);
      const estimatedBytes = estimateDataUrlBytes(result);
      if (estimatedBytes <= targetBytes) {
        return result;
      }

      width = Math.round(width * 0.9);
      height = Math.round(height * 0.9);
    }

    quality -= 0.08;
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

function renderImage(image, resolution, quality) {
  validateResolution(resolution);
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

function estimateDataUrlBytes(dataUrl) {
  const payload = dataUrl.split(",")[1] || "";
  return Math.ceil((payload.length * 3) / 4);
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
