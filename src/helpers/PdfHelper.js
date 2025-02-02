// src/helpers/PdfHelper.js

import { _GSPS2PDF } from '../ghostscript-utils';

import Logger from '../helpers/Error/Logger';

const logger = new Logger('pdfconverter.vue');


function compressPDF(pdf, filename, compressionLevel, onLoadComplete, onProgress, onStatusUpdate) {
  const dataObject = { psDataURL: pdf };
  try {
    _GSPS2PDF(dataObject,
      (element) => {
        onLoadComplete(element);
      },
      (...args) => onProgress(args),
      (element) => onStatusUpdate(element),
      compressionLevel
    );
  } catch (error) {
    logger.logError(error);
    throw error;
  }
}

export { compressPDF };
