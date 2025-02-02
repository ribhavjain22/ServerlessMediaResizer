import { PDFDocument } from 'pdf-lib';

export async function compressPDFToTargetSize(fileBuffer, targetSizeInBytes, options = {}) {
  const {
    minQuality = 0.2,
    maxAttempts = 5,
    imageResolutionMultiplier = 0.9
  } = options;

  let currentQuality = 1.0;
  let currentImageScale = 1.0;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const pdfDoc = await PDFDocument.load(fileBuffer);
      const pages = pdfDoc.getPages();
      
      // Compress all images in the PDF
      for (const page of pages) {
        const { images } = await page.node.Resources().lookup(PDFName.of('XObject'));
        if (!images) continue;

        for (const [name, image] of Object.entries(images.dict)) {
          if (image instanceof PDFStream) {
            const imageData = image.getContents();
            const compressedImage = await compressImage(
              imageData, 
              currentQuality, 
              currentImageScale
            );
            image.setContents(compressedImage);
          }
        }
      }

      // Set compression options
      const compressedPDF = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
        objectsPerTick: 50,
        updateFieldAppearances: false,
        compress: true
      });

      const compressedSize = compressedPDF.length;
      
      if (compressedSize <= targetSizeInBytes) {
        return compressedPDF;
      }

      // Adjust compression parameters for next attempt
      currentQuality = Math.max(currentQuality * 0.8, minQuality);
      currentImageScale *= imageResolutionMultiplier;
      
    } catch (error) {
      console.error('Compression attempt failed:', error);
      throw new Error('PDF compression failed');
    }
  }

  throw new Error('Unable to reach target size after maximum attempts');
}

async function compressImage(imageData, quality, scale) {
  // Create a canvas to resize the image
  const img = new Image();
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  return new Promise((resolve) => {
    img.onload = () => {
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Convert to compressed JPEG
      const compressedData = canvas.toDataURL('image/jpeg', quality);
      resolve(Buffer.from(compressedData.split(',')[1], 'base64'));
    };
    
    img.src = URL.createObjectURL(new Blob([imageData]));
  });
} 