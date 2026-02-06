<template>
  <div class="page-root">
    <header class="navbar">
      <router-link to="/" class="navbar-brand">ConvertEase</router-link>
      <nav class="navbar-nav">
        <ul class="navbar-nav">
          <li class="nav-item"><router-link to="/" class="nav-link">Home</router-link></li>
          <li class="nav-item"><router-link to="/features" class="nav-link">Features</router-link></li>
        </ul>
      </nav>
    </header>
    <form @submit="onSubmit" class="form-container">
      <div v-if="!file" class="upload-container" @dragover.prevent @drop.prevent="onDrop">
        <div class="apple-drop-zone" 
             @dragenter.prevent="dragActive = true"
             @dragleave.prevent="dragActive = false"
             :class="{ 'drop-active': dragActive }">
          <div class="upload-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M12 5L7 10M12 5L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h3 class="upload-title">Drop your PDF here</h3>
          <p class="upload-subtitle">or</p>
          <label class="apple-button">
            <input type="file" @change="onFileChange" accept="application/pdf" class="hidden-input">
            Select PDF
          </label>
        </div>
      </div>
      <div v-if="file" class="resize-fields">
        <div class="file-info">
          <p>File Name: {{ file.filename }}</p>
          <p>File Size: {{ file.size }} KB</p>
        </div>
        <div class="compression-options">
          <div class="target-size-container">
             <label for="target-size">Target File Size (MB):</label>
             <input 
               id="target-size" 
               type="number" 
               step="0.1" 
               min="0.1" 
               v-model="targetSizeMB" 
               class="size-input"
             />
             <p class="size-hint">The original file is {{ (file.size / 1024).toFixed(2) }} MB. Suggested: {{ ((file.size / 1024) * 0.5).toFixed(2) }} MB</p>
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
import { COMPRESSION_STATE } from '../models/ENUM/COMPRESSION_STATE';
import Logger from '../helpers/Error/Logger';

const logger = new Logger('pdfconverter.vue');

export default {
  setup() {
    const file = ref(null);
    const state = ref(COMPRESSION_STATE.NO_FILE_SELECTED);
    const downloadLink = ref('');
    const targetSizeMB = ref(1.0); // Default 1MB
    const useTargetSize = ref(true);
    const dragActive = ref(false);

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
        alert(errorMessage);
      }
    }

    function onFileChange(event) {
      try {
        const uploadedFile = event.target.files[0];
        if (uploadedFile && uploadedFile.type === 'application/pdf') {
          const url = window.URL.createObjectURL(uploadedFile);
          const size = (uploadedFile.size / 1024).toFixed(2);
          file.value = { filename: uploadedFile.name, url, size, rawFile: uploadedFile };
          state.value = COMPRESSION_STATE.FILE_SELECTED;
          
          // Set a reasonable default target size (e.g., 50% of original)
          targetSizeMB.value = parseFloat(((uploadedFile.size / 1024 / 1024) * 0.5).toFixed(2));
          if (targetSizeMB.value < 0.1) targetSizeMB.value = 0.1;
          
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
      
      const formData = new FormData();
      formData.append('file', file.value.rawFile);
      // Backend expects KB, but let's stick to what we decided in app.py or adjust. 
      // app.py expects targetSize (KB).
      const targetSizeKB = Math.round(targetSizeMB.value * 1024);
      formData.append('targetSize', targetSizeKB);

      // Get API URL from env or default to local Flask port
      const API_URL = import.meta.env.VITE_PDF_SERVICE_URL || 'http://localhost:5000';

      try {
        const response = await fetch(`${API_URL}/resize-pdf`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
           const errorText = await response.text();
           throw new Error(`Server error: ${response.status} - ${errorText}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        state.value = COMPRESSION_STATE.READY_FOR_DOWNLOAD;
        downloadLink.value = url;
        
      } catch (error) {
        logger.logError(error);
        state.value = COMPRESSION_STATE.FILE_SELECTED;
        alert(`Compression failed: ${error.message}`);
      }
    }

    return {
      file,
      state,
      targetSizeMB,
      useTargetSize,
      dragActive,
      safeDownloadLink,
      onFileChange,
      onSubmit,
    };
  }
};
</script>

<style scoped src="../assets/styles/DocumentStyles.css"></style>
<style scoped>
.target-size-container {
  margin: 1rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.size-input {
  padding: 0.5rem;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 150px;
  text-align: center;
}

.size-hint {
  font-size: 0.8rem;
  color: #666;
}
</style>