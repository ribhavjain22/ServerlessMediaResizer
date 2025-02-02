<template>
  <div id="app">
    <nav class="navbar">
      <router-link to="/" class="navbar-brand">PDF Compressor</router-link>
      <ul class="navbar-nav">
        <li class="nav-item"><router-link to="/" class="nav-link">Home</router-link></li>
        <li class="nav-item"><router-link to="/about" class="nav-link">About</router-link></li>
      </ul>
    </nav>
    <form @submit="onSubmit" class="form-container">
      <div v-if="!file" class="upload-container" @dragover.prevent @drop.prevent="onDrop">
        <label class="upload-label">
          <span>Drag and drop your PDF here</span>
          <span class="button upload">Upload PDF</span>
          <input type="file" @change="onFileChange" accept="application/pdf" />
        </label>
      </div>
      <div v-if="file" class="resize-fields">
        <div class="file-info">
          <p>File Name: {{ file.filename }}</p>
          <p>File Size: {{ file.size }} KB</p>
        </div>
        <div class="compression-options">
          <div class="preset-options">
            <select v-model="compressionLevel" class="input-width">
              <option value="LOW">Low Compression</option>
              <option value="MEDIUM">Medium Compression</option>
              <option value="HIGH">High Compression</option>
            </select>
          </div>
        </div>
        <div class="buttons">
          <button type="submit" class="compress-button">Compress PDF</button>
        </div>
      </div>
    </form>
    <div v-if="state === 'COMPRESSION_IN_PROGRESS'" class="downloading-message">Compressing...</div>
    <div v-if="state === 'READY_FOR_DOWNLOAD'" class="download-section">
      <div class="adjacent-container">
        <a :href="safeDownloadLink" download="compressed.pdf" class="download-message">Download</a>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { compressPDF } from '../helpers/PdfHelper';
import { PdfData } from '../models/pdf/PdfModel';
import { COMPRESSION_STATE } from '../models/ENUM/COMPRESSION_STATE';
import { COMPRESSION_LEVEL } from '../models/ENUM/COMPRESSION_LEVEL';
import Logger from '../helpers/Error/Logger';

const logger = new Logger('pdfconverter.vue');

export default {
  setup() {
    const file = ref(null);
    const state = ref(COMPRESSION_STATE.NO_FILE_SELECTED);
    const downloadLink = ref('');
    const compressionLevel = ref(COMPRESSION_LEVEL.LOW);

    const safeDownloadLink = computed(() => {
      return isValidUrl(downloadLink.value) ? downloadLink.value : '';
    });

    function isValidUrl(url) {
      try {
        return Boolean(url && new URL(url));
      } catch {
        return false;
      }
    }

    function resetFileState(errorMessage) {
      file.value = null;
      state.value = COMPRESSION_STATE.NO_FILE_SELECTED;
      if (errorMessage) {
        console.error(errorMessage);
      }
    }

    function onFileChange(event) {
      try {
        const uploadedFile = event.target.files[0];
        if (uploadedFile && uploadedFile.type === 'application/pdf') {
          const url = window.URL.createObjectURL(uploadedFile);
          const size = (uploadedFile.size / 1024).toFixed(2);
          file.value = { filename: uploadedFile.name, url, size };
          state.value = COMPRESSION_STATE.FILE_SELECTED;
        } else {
          resetFileState('Invalid file type. Please upload a PDF file.');
        }
      } catch (error) {
        logger.logError(error);
        resetFileState('Error processing file.');
      }
    }

    async function onSubmit(event) {
      event.preventDefault();
      if (!file.value) return;

      state.value = COMPRESSION_STATE.COMPRESSION_IN_PROGRESS;
      try {
        await compressPDF(
          file.value.url,
          file.value.filename,
          { mode: 'preset', level: compressionLevel.value },
          handleCompressionCompletion,
          showProgress,
          showStatusUpdate
        );
      } catch (error) {
        logger.logError(error);
        state.value = COMPRESSION_STATE.FILE_SELECTED;
      }
    }

    function showProgress(...args) {
      console.log('Compression Progress:', args);
    }

    function showStatusUpdate(element) {
      console.log('Status Update:', element);
    }

    async function handleCompressionCompletion(element) {
      try {
        state.value = COMPRESSION_STATE.READY_FOR_DOWNLOAD;
        downloadLink.value = element.pdfDataURL;
      } catch (error) {
        logger.logError(error);
        state.value = COMPRESSION_STATE.FILE_SELECTED;
      }
    }

    return {
      file,
      state,
      compressionLevel,
      safeDownloadLink,
      onFileChange,
      onSubmit,
    };
  }
};
</script>

<style scoped src="../assets/styles/DocumentStyles.css"></style>