// src/helpers/PdfHelper.js

import { PDFDocument, PDFName, PDFStream, PDFDict } from 'pdf-lib';
import Logger from './Error/Logger';
import { _GSPS2PDF } from '../ghostscript-utils'; // Import your Ghostscript wrapper

const logger = new Logger('pdfconverter.vue');

async function compressPDF(pdfUrl, filename, options, onLoadComplete, onProgress, onStatusUpdate) {
  try {
    const response = await fetch(pdfUrl);
    const pdfBuffer = await response.arrayBuffer();
    
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;
    
    // 1. Remove metadata and unnecessary elements
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setCreator('');
    pdfDoc.setProducer('');

    // 2. Process each page
    for (let i = 0; i < totalPages; i++) {
      const page = pages[i];
      await optimizePage(page, options);
      onProgress?.((i + 1) / totalPages * 100);
      onStatusUpdate(`Processing page ${i + 1}/${totalPages}`);
    }

    // 3. Save with optimized settings
    const compressedPdf = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 50,
      updateFieldAppearances: false,
      compress: true
    });

    const compressedSize = compressedPdf.byteLength;
    const targetSize = options.mode === 'custom' ? 
      options.targetSize : 
      getPresetTargetSize(options.level, pdfBuffer.byteLength);

    if (compressedSize <= targetSize) {
      const blob = new Blob([compressedPdf], { type: 'application/pdf' });
      onLoadComplete({ 
        pdfDataURL: URL.createObjectURL(blob),
        finalSize: compressedSize,
        targetReached: true
      });
      return;
    }

    // 4. If target not reached, try aggressive compression
    const aggressiveResult = await performAggressiveCompression(pdfDoc, options, targetSize);
    const blob = new Blob([aggressiveResult.pdf], { type: 'application/pdf' });
    onLoadComplete({ 
      pdfDataURL: URL.createObjectURL(blob),
      finalSize: aggressiveResult.size,
      targetReached: aggressiveResult.size <= targetSize
    });

  } catch (error) {
    logger.logError(error);
    throw error;
  }
}

async function optimizePage(page, options) {
  // 1. Image optimization
  await optimizeImages(page, options);
  
  // 2. Font subset and compression
  await optimizeFonts(page);
  
  // 3. Remove unnecessary content
  cleanupPageContent(page);
}

async function optimizeImages(page, options) {
  const resources = await page.node.Resources();
  if (!resources) return;

  const xObjects = resources.lookup(PDFName.of('XObject'));
  if (!xObjects || !xObjects.dict) return;

  for (const [name, xObject] of Object.entries(xObjects.dict)) {
    if (xObject instanceof PDFStream) {
      const imageQuality = getImageQuality(options);
      const imageScale = getImageScale(options);
      
      // Convert to WebP for better compression
      await compressImageWithWebP(xObject, imageQuality, imageScale);
    }
  }
}

async function compressImageWithWebP(image, quality, scale) {
  const imageData = image.getContents();
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  const img = new Image();
  await new Promise((resolve) => {
    img.onload = resolve;
    img.src = URL.createObjectURL(new Blob([imageData]));
  });

  // Scale image
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;
  
  // Use better quality settings for important content
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // Convert to WebP with optimal settings
  const compressedData = canvas.toDataURL('image/webp', {
    quality: quality,
    lossless: quality > 0.8,
    method: 6, // Best compression
    exact: true
  });
  
  image.setContents(Buffer.from(compressedData.split(',')[1], 'base64'));
}

function getPresetTargetSize(level, originalSize) {
  const ratios = {
    'HIGH': 0.2,
    'MEDIUM': 0.4,
    'LOW': 0.6
  };
  return originalSize * (ratios[level] || 0.4);
}

async function processPage(page, quality, scale) {
  try {
    const resources = await page.node.Resources();
    if (!resources) return;

    const xObjects = resources.lookup(PDFName.of('XObject'));
    if (!xObjects || !xObjects.dict) return;

    for (const [name, xObject] of Object.entries(xObjects.dict)) {
      if (xObject instanceof PDFStream) {
        await compressImage(xObject, quality, scale);
      }
    }
  } catch (error) {
    logger.logError(error);
  }
}

async function compressImage(image, quality, scale) {
  try {
    const imageData = image.getContents();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    await new Promise((resolve) => {
      img.onload = resolve;
      img.src = URL.createObjectURL(new Blob([imageData]));
    });

    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const compressedData = canvas.toDataURL('image/jpeg', quality);
    
    image.setContents(Buffer.from(compressedData.split(',')[1], 'base64'));
  } catch (error) {
    logger.logError(error);
  }
}

async function optimizeFonts(page) {
  try {
    const resources = await page.node.Resources();
    if (!resources) return;

    const fonts = resources.lookup(PDFName.of('Font'));
    if (!fonts || !fonts.dict) return;

    for (const [name, font] of Object.entries(fonts.dict)) {
      if (font instanceof PDFDict) {
        // Subset fonts to include only used characters
        await subsetFont(font);
      }
    }
  } catch (error) {
    logger.logError(error);
  }
}

async function subsetFont(font) {
  try {
    const fontDescriptor = font.lookup(PDFName.of('FontDescriptor'));
    if (!fontDescriptor) return;

    // Set font compression flags
    fontDescriptor.set(PDFName.of('Flags'), 32);
    if (fontDescriptor.has(PDFName.of('FontFile'))) {
      const fontFile = fontDescriptor.lookup(PDFName.of('FontFile'));
      if (fontFile instanceof PDFStream) {
        fontFile.dict.set(PDFName.of('Filter'), PDFName.of('FlateDecode'));
      }
    }
  } catch (error) {
    logger.logError(error);
  }
}

function cleanupPageContent(page) {
  try {
    // Remove unnecessary annotations
    page.node.delete(PDFName.of('Annots'));
    
    // Remove metadata from page
    page.node.delete(PDFName.of('PieceInfo'));
    page.node.delete(PDFName.of('Metadata'));
    page.node.delete(PDFName.of('Thumb'));
  } catch (error) {
    logger.logError(error);
  }
}

async function performAggressiveCompression(pdfDoc, options, targetSize) {
  const pages = pdfDoc.getPages();
  
  // Apply maximum compression settings
  const aggressiveOptions = {
    ...options,
    imageQuality: 0.1,
    imageScale: 0.5,
    monoImageResolution: 72,
    colorImageResolution: 72,
    grayImageResolution: 72
  };

  // Process pages with aggressive settings
  for (const page of pages) {
    await optimizePage(page, aggressiveOptions);
  }

  const compressedPdf = await pdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
    objectsPerTick: 20,
    updateFieldAppearances: false,
    compress: true
  });

  return {
    pdf: compressedPdf,
    size: compressedPdf.byteLength
  };
}

function getImageQuality(options) {
  if (options.mode === 'custom') {
    const ratio = options.targetSize / options.originalSize;
    return Math.max(0.1, Math.min(1.0, ratio));
  }
  
  const qualityMap = {
    'HIGH': 0.3,
    'MEDIUM': 0.5,
    'LOW': 0.7
  };
  return qualityMap[options.level] || 0.5;
}

function getImageScale(options) {
  if (options.mode === 'custom') {
    const ratio = Math.sqrt(options.targetSize / options.originalSize);
    return Math.max(0.3, Math.min(1.0, ratio));
  }
  
  const scaleMap = {
    'HIGH': 0.5,
    'MEDIUM': 0.7,
    'LOW': 0.9
  };
  return scaleMap[options.level] || 0.7;
}

export async function compressPDFWithGhostscript(pdfUrl, filename, options, onLoadComplete, onProgress, onStatusUpdate) {
  try {
    // 1. Fetch the PDF
    const response = await fetch(pdfUrl);
    const pdfBuffer = await response.arrayBuffer();

    // 2. Load with pdf-lib (if you want to do any pdf-lib-based manipulations first)
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    // ... Perform any pdf-lib manipulation, optimization, etc. ...

    // 3. Save resulting PDF
    const partialPdf = await pdfDoc.save({
      useObjectStreams: true,
      compress: true
    });

    // 4. Create a Blob / Object URL so Ghostscript can read it
    const blob = new Blob([partialPdf], { type: 'application/pdf' });
    const intermediateUrl = URL.createObjectURL(blob);

    // 5. Call Ghostscript (i.e. _GSPS2PDF) to apply further compression
    _GSPS2PDF(
      { psDataURL: intermediateUrl, url: pdfUrl },
      (result) => {
        onLoadComplete({
          pdfDataURL: result.pdfDataURL,
          finalSize: null, // or you can fetch the size if desired
          targetReached: true
        });
      },
      (completed, current, total) => {
        // progress callback
        onProgress?.(completed ? 100 : (current / total) * 100);
      },
      onStatusUpdate,
      options.level // COMPRESSION_LEVEL.LOW / MEDIUM / HIGH
    );
  } catch (error) {
    console.error('Error during Ghostscript compression:', error);
    throw error;
  }
}

export { compressPDF };