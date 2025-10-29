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

    <div class="content">
      <div v-if="!isImageLoaded" class="upload-container">
        <div class="apple-drop-zone" 
             @drop.prevent="handleFileDrop" 
             @dragover.prevent
             @dragenter.prevent="dragActive = true"
             @dragleave.prevent="dragActive = false"
             :class="{ 'drop-active': dragActive }">
          <div class="upload-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M12 5L7 10M12 5L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h3 class="upload-title">Drop your image here</h3>
          <p class="upload-subtitle">or</p>
          <label class="apple-button">
            <input type="file" 
                   @change="handleFileSelection" 
                   accept="image/*"
                   :disabled="appStateInstance.isDownloading"
                   class="hidden-input">
            Select Image
          </label>
        </div>
      </div>

      <div v-if="isImageLoaded" class="apple-card image-details">
        <div class="detail-row">
          <span class="detail-label">File Name</span>
          <span class="detail-value">{{ imageModelInstance.currentFileName }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Current Dimensions</span>
          <span class="detail-value">{{ imageModelInstance.currentResolution.width }} × {{ imageModelInstance.currentResolution.height }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Current Size</span>
          <span class="detail-value">{{ (imageModelInstance.currentFileSize / 1048576).toFixed(2) }} MB</span>
        </div>
      </div>

      <div v-if="appStateInstance.showResizeFields" class="apple-card resize-fields">
        <div class="input-group">
          <label class="apple-label" for="targetWidth">Width</label>
          <input type="number" 
                 id="targetWidth"
                 v-model="targetResolution.width" 
                 class="apple-input" 
                 placeholder="Enter target width"
                 @input="updateDimensions(Dimension.WIDTH)" 
                 min="1" 
                 required>
          <p v-if="targetResolution.width < 1 || isNaN(targetResolution.width)" class="apple-error">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 14A6 6 0 108 2a6 6 0 000 12zM8 5v4M8 11h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Width must be a number greater than 0
          </p>
        </div>

        <div class="input-group">
          <label class="apple-label" for="targetHeight">Height</label>
          <input type="number" 
                 id="targetHeight"
                 v-model="targetResolution.height" 
                 class="apple-input" 
                 placeholder="Enter target height"
                 @input="updateDimensions(Dimension.HEIGHT)" 
                 min="1" 
                 required>
          <p v-if="targetResolution.height < 1 || isNaN(targetResolution.height)" class="apple-error">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 14A6 6 0 108 2a6 6 0 000 12zM8 5v4M8 11h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Height must be a number greater than 0
          </p>
        </div>

        <p v-if="targetResolution.width * targetResolution.height > 25600000" class="apple-error">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 14A6 6 0 108 2a6 6 0 000 12zM8 5v4M8 11h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          The product of width and height must not exceed 25,600,000
        </p>

        <label class="apple-checkbox">
          <input type="checkbox" v-model="appStateInstance.keepAspectRatio">
          <span>Keep Aspect Ratio</span>
        </label>
        <div class="submit-button">
          <button @click="resizeImageByResolution"
            :disabled="appStateInstance.isDownloading || hasValidationErrors || appStateInstance.buttonsDisabled || !isImageLoaded || hasErrors"
            :class="{ blurred: appStateInstance.buttonsDisabled || hasErrors }">
            Submit
          </button>
          <button @click="resetImageForm"
            :disabled="appStateInstance.isDownloading || appStateInstance.buttonsDisabled || !isImageLoaded"
            :class="{ blurred: appStateInstance.buttonsDisabled }">Go Back</button>
        </div>
      </div>

      <div v-else-if="isImageLoaded" class="initial-options">
        <button class="resize-button" @click="showResizeFields"
          :disabled="appStateInstance.isDownloading || appStateInstance.buttonsDisabled"
          :class="{ blurred: appStateInstance.buttonsDisabled }">Resize Image</button>
        <label for="sizeOptions" class="reduce-size-label">Reduce Image Size:</label>
        <select v-model="selectedSize" @change="resizeImageByFileSize" class="reduce-size-select"
          :disabled="appStateInstance.isDownloading || appStateInstance.buttonsDisabled"
          :class="{ blurred: appStateInstance.buttonsDisabled }">
          <option value="" disabled>Select a size</option>
          <option value="512000">500 KB</option>
          <option value="1048576">1 MB</option>
          <option value="2097152">2 MB</option>
          <option value="3145728">3 MB</option>
        </select>
      </div>
      <canvas ref="canvas" style="display:none;"></canvas>
      <p v-if="appStateInstance.isDownloading" class="downloading-message">Downloading... please wait</p>
      <p v-if="appStateInstance.errorMessage" class="error">{{ appStateInstance.errorMessage }}</p>
    </div>
  </div>
</template>

<script>
import { ImageData } from '@/models/image/ImageModel';
import { getScaledResolution, resizeImageByResolution, resizeImageByFileSize } from '../helpers/ImageHelper';
import { AppState } from '@/models/app/AppState';
import { Errors } from '@/models/image/ImageDimensionsErrorMessage';
import { ImageResolution } from '@/models/image/ImageResolution.js';
import { Dimension } from '@/models/ENUM/ImageDimension';



export default {
  data() {
    return {
      imageModelInstance: null,
      errorMessages: new Errors(),
      appStateInstance: new AppState(),
      selectedSize: '',
      lastModifiedDimension: '',
      targetResolution: new ImageResolution(1, 1),
      Dimension
    };
  },
  computed: {
    hasValidationErrors() {
      return this.targetResolution.width <= 0 || this.targetResolution.height <= 0 || this.targetResolution.width * this.targetResolution.height > 25600000;
    },
    isImageLoaded() {
      return !!this.imageModelInstance?.currentImageSrc;
    },
    hasErrors() {
      return !!this.appStateInstance.errorMessage;
    }
  },
  methods: {
    async handleFileSelection(event) {
      const file = event.target.files[0];
      if (!file) {
        this.displayErrorMessage("No file selected.");
        return;
      }

      try {
        this.imageModelInstance = await new ImageData(file);
        this.updateState(true, false);
      } catch (error) {
        this.displayErrorMessage(error.message || "An error occurred while loading the image.");
      }
    },
    async handleFileDrop(event) {
      event.preventDefault(); // Prevent default behavior (Prevent file from being opened)
      const files = event.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];

        try {
          this.imageModelInstance = await new ImageData(file);
          this.updateState(true, false);
        } catch (error) {
          this.displayErrorMessage(error.message || "An error occurred while loading the image.");
        }
      }
    },
    updateState(currentDimensionsVisible, buttonsDisabled) {
      this.appStateInstance.currentDimensionsVisible = currentDimensionsVisible;
      this.appStateInstance.buttonsDisabled = buttonsDisabled;
    },
    keepAspectRatio(dimension) {
      if (dimension === Dimension.WIDTH) {
        const newResolution = getScaledResolution(this.imageModelInstance.currentResolution, this.targetResolution.width);
        this.targetResolution.height = newResolution.height;
      } else if (dimension === Dimension.HEIGHT) {
        const newResolution = getScaledResolution(this.imageModelInstance.currentResolution, undefined, this.targetResolution.height);
        this.targetResolution.width = newResolution.width;
      }
    },
    updateDimensions(dimension) {
      this.lastModifiedDimension = dimension;
      if (this.appStateInstance.keepAspectRatio) {
        this.keepAspectRatio(dimension);
      }
    },
    resizeImageByResolution() {
      const img = new Image();
      img.src = this.imageModelInstance.currentImageSrc;
      img.onload = () => {
        try {
          const resizedImageURL = resizeImageByResolution(img, this.targetResolution);
          this.createDownloadLinkAndTriggerDownload(resizedImageURL, 'resized-image.jpg');
          this.appStateInstance.currentDimensionsVisible = false;
        } catch (error) {
          this.displayErrorMessage(error.message);
        }
      };
    },
    resizeImageByFileSize() {
      if (!this.selectedSize) {
        this.displayErrorMessage("Please select a size.");
        return;
      }
      const img = new Image();
      img.src = this.imageModelInstance.currentImageSrc;
      img.onload = () => {
        try {
          const reducedImageURL = resizeImageByFileSize(img, parseInt(this.selectedSize));
          this.createDownloadLinkAndTriggerDownload(reducedImageURL, `reduced-size-image-${this.selectedSize}.jpg`);
        } catch (error) {
          this.displayErrorMessage(error.message || "An error occurred while reducing the image size.");
        }
      };
    },
    createDownloadLinkAndTriggerDownload(dataURL, fileName) {
      this.appStateInstance.isDownloading = true;
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => {
        this.appStateInstance.isDownloading = false;
      }, 2000);
    },
    showResizeFields() {
      this.appStateInstance.showResizeFields = true;
      this.appStateInstance.currentDimensionsVisible = true;
    },
    resetImageForm() {
      this.appStateInstance.showResizeFields = false;
      this.targetWidth = null;
      this.targetHeight = null;
      this.appStateInstance.errorMessage = '';
      this.appStateInstance.currentDimensionsVisible = true;
      this.appStateInstance.buttonsDisabled = false;
    },
    displayErrorMessage(message) {
      this.appStateInstance.errorMessage = message;
      this.appStateInstance.buttonsDisabled = true;
    },
  },
};
</script>

<style scoped src="../assets/styles/ImageStyles.css"></style>