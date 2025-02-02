<template>
  <div id="app">
    <nav class="navbar">
      <a href="/" class="navbar-brand">PDF Compressor</a>
      <ul class="navbar-nav">
        <li class="nav-item"><a href="/" class="nav-link">Home</a></li>
        <li class="nav-item"><a href="#" class="nav-link">About</a></li>
      </ul>
    </nav>
    <form @submit="onSubmit" class="form-container">
      <div v-if="!file" class="upload-container" @dragover.prevent @drop.prevent="onDrop">
        <label class="upload-label">
          <span>Drag and drop your PDF here</span>
          <span class="button upload">Upload PDF</span>
          <input type="file" @change="onFileChange" />
        </label>
      </div>
      <div v-if="file" class="resize-fields">
        <div class="file-info">
          <p>File Name: {{ file.filename }}</p>
          <p>File Size: {{ file.size }} KB</p>
        </div>
        <select v-model="compressionLevel" class="input-width">
          <option value="LOW">Low Compression</option>
          <option value="MEDIUM">Medium Compression</option>
          <option value="HIGH">High Compression</option>
        </select>
        <div class="buttons">
          <button type="submit" class="compress-button">Compress PDF</button>
        </div>
      </div>
    </form>
    <div v-if="state === 'COMPRESSION_IN_PROGRESS'" class="downloading-message">Compressing...</div>
    <div v-if="state === 'READY_FOR_DOWNLOAD'" class="download-section">
      <div class="adjacent-container">
        <a :href="safeDownloadLink" download="compressed.pdf" class="download-messagee">Download</a>
      </div>
    </div>
  </div>
</template>

<script>
import { compressPDF } from '../helpers/PdfHelper';
import { PdfData } from '../models/pdf/PdfModel';
import { COMPRESSION_STATE } from '@/models/ENUM/COMPRESSION_STATE';
import Logger from '../helpers/Error/Logger';

const logger = new Logger('pdfconverter.vue');

export default {
  data() {
    const uploadedPdf = new PdfData();
    return {
      state: uploadedPdf.filestate,
      file: uploadedPdf.selectedFileMetadata,
      downloadLink: uploadedPdf.downloadLink,
      compressionLevel: uploadedPdf.compressionLevel
    };
  },
  computed: {
    safeDownloadLink() {
      return this.isValidUrl(this.downloadLink) ? this.downloadLink : '';
    }
  },
  methods: {
    onFileChange(event) {
      try {
        const file = event.target.files[0];
        if (file && file.type === 'application/pdf') {
          const url = window.URL.createObjectURL(file);
          const size = (file.size / 1024).toFixed(2); // Size in KB
          this.file = { filename: file.name, url, size };
          this.state = COMPRESSION_STATE.FILE_SELECTED;
        } else {
          this.resetFileState('Invalid file type. Please upload a PDF file.');
        }
      } catch (error) {
        logger.logError(error);
      }
    },
    onDrop(event) {
      try {
        const file = event.dataTransfer.files[0];
        if (file && file.type === 'application/pdf') {
          const url = window.URL.createObjectURL(file);
          const size = (file.size / 1024).toFixed(2); // Size in KB
          this.file = { filename: file.name, url, size };
          this.state = COMPRESSION_STATE.FILE_SELECTED;
        } else {
          this.resetFileState('Invalid file type. Please upload a PDF file.');
        }
      } catch (error) {
        logger.logError(error);
      }
    },
    async onSubmit(event) {
      event.preventDefault();
      if (this.file) {
        const { filename, url } = this.file;
        this.state = COMPRESSION_STATE.COMPRESSION_IN_PROGRESS;
        try {
          await this.beginCompression(url, filename, this.compressionLevel);
        } catch (error) {
          logger.logError(error);
          this.state = COMPRESSION_STATE.FILE_SELECTED;
        }
      }
    },
    async beginCompression(url, filename, compressionLevel) {
      try {
        await compressPDF(
          url,
          filename,
          compressionLevel,
          this.handleCompressionCompletion,
          this.showProgress,
          this.showStatusUpdate
        );
      } catch (error) {
        logger.logError(error);
        throw error;
      }
    },
    async handleCompressionCompletion(element) {
      try {
        this.state = COMPRESSION_STATE.READY_FOR_DOWNLOAD;
        const { pdfURL } = await this.getPdfDownloadLink(element);
        if (this.isValidUrl(pdfURL)) {
          this.downloadLink = pdfURL;
        } else {
          throw new Error('Invalid download link.');
        }
      } catch (error) {
        logger.logError(error);
        this.state = COMPRESSION_STATE.FILE_SELECTED;
      }
    },
    showProgress(...args) {
      console.log('Compression Progress:', JSON.stringify(args));
    },
    showStatusUpdate(element) {
      console.log('Compression Status Update:', JSON.stringify(element));
    },
    async getPdfDownloadLink(element) {
      try {
        return Promise.resolve({ pdfURL: element.pdfDataURL });
      } catch (error) {
        logger.logError(error);
        throw error;
      }
    },
    isValidUrl(url) {
      try {
        new URL(url);
        return true;
      } catch (_) {
        return false;
      }
    },
    doAnotherConversion() {
      window.location.reload();
    },
    resetFileState(message) {
      this.file = null;
      alert(message);
    }
  }
};
</script>

<style scoped src="../assets/styles/DocumentStyles.css"></style>
