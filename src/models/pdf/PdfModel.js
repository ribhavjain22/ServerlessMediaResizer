import { COMPRESSION_LEVEL } from "../ENUM/COMPRESSION_LEVEL";
import { COMPRESSION_STATE } from "../ENUM/COMPRESSION_STATE";

class PdfData {
  constructor() {

    /** @type {string} */
    this.filestate = COMPRESSION_STATE.NO_FILE_SELECTED;

    /** @type {{ filename: string, url: string } | null} */
    this.selectedFileMetadata = null;

    /** @type {URL} */
    this.downloadLink = '';

    /** @type { COMPRESSION_LEVEL.LOW | COMPRESSION_LEVEL.MEDIUM | COMPRESSION_LEVEL.HIGH} */
    this.compressionLevel = COMPRESSION_LEVEL.LOW;
  }
}

export { PdfData };