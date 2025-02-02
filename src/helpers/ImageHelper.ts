import { ImageResolution } from '@/models/image/ImageResolution';


export function resizeImageByResolution(imageElement: HTMLImageElement, targetImageResolution: { width: number; height: number }, qualityFactor: number = 1.0): string {
  const canvasElement = document.createElement('canvas');
  canvasElement.width = targetImageResolution.width;
  canvasElement.height = targetImageResolution.height;
  const canvasElementContext = canvasElement.getContext('2d');
  canvasElementContext.drawImage(imageElement, 0, 0, targetImageResolution.width, targetImageResolution.height);
  return canvasElement.toDataURL('image/jpeg', qualityFactor);
}

export function resizeImageByFileSize(imageElement: HTMLImageElement, targetSizeInBytes: number): string {
  const minimumImageResolution = { width: 50, height: 50 }; // Minimum allowable dimensions to avoid too much reduction
  let qualityFactor = 1.0;
  const targetImageResolution = new ImageResolution(imageElement.width, imageElement.height);

  while (true) {
    const reductionRatio = Math.sqrt(targetSizeInBytes / (imageElement.src.length * 3 / 4));
    targetImageResolution.width = Math.round(imageElement.width * reductionRatio);
    targetImageResolution.height = Math.round(imageElement.height * reductionRatio);

    while (targetImageResolution.width > minimumImageResolution.width && targetImageResolution.height > minimumImageResolution.height) {
      const resizedImage = resizeImageByResolution(imageElement, targetImageResolution, qualityFactor);
      const resizedImageSizeInBytes = resizedImage.length * 3 / 4;

      if (resizedImageSizeInBytes <= targetSizeInBytes) {
        return resizedImage;
      }

      // Reduce the target dimensions by 10%
      targetImageResolution.width = Math.round(targetImageResolution.width * 0.9);
      targetImageResolution.height = Math.round(targetImageResolution.height * 0.9);
    }

    qualityFactor -= 0.1;
    if (qualityFactor <= 0.5) {
      throw new Error("Unable to convert file, target size too small");
    }
  }
}

export function getScaledResolution(currentResolution: ImageResolution, targetWidth: number): ImageResolution;
export function getScaledResolution(currentResolution: ImageResolution, targetHeight: number): ImageResolution;

export function getScaledResolution(currentResolution: ImageResolution, targetWidth?: number, targetHeight?: number): ImageResolution {

  const aspectRatio: number = currentResolution.width / currentResolution.height;

  if (targetWidth !== undefined && targetHeight === undefined) {
    return new ImageResolution(targetWidth, Math.round(targetWidth / aspectRatio));
  } else if (targetWidth === undefined && targetHeight !== undefined) {
    return new ImageResolution(Math.round(targetHeight * aspectRatio), targetHeight);
  } else if (targetWidth !== undefined && targetHeight !== undefined) {
    return new ImageResolution(targetWidth, targetHeight);
  }

  throw new Error("Either targetWidth or targetHeight must be provided.");
}