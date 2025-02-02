<template>
  <div id="app">
    <!-- Navbar -->
    <nav class="navbar">
      <a href="/" class="navbar-brand">Image App</a>
      <ul class="navbar-nav">
        <li class="nav-item"><a href="/" class="nav-link">Home</a></li>
        <li class="nav-item"><a href="#" class="nav-link">Features</a></li>
      </ul>
    </nav>

    <div class="content">
      <div v-if="!isImageLoaded" class="upload-container">
        <div class="drag-drop-area" @drop.prevent="handleFileDrop" @dragover.prevent>
          <label class="upload-label">
            <input type="file" @change="handleFileSelection" accept="image/*"
              :disabled="appStateInstance.isDownloading">
            <span class="button">Select Image</span>
          </label>
          <p>or drag and drop an image here</p>
        </div>
      </div>

      <div v-if="isImageLoaded" class="image-details">
        <p><strong>Selected File:</strong> {{ imageModelInstance.currentFileName }}</p>
        <p>Current Dimensions: <span>{{ imageModelInstance.currentResolution.width }}</span> x <span>{{
          imageModelInstance.currentResolution.height }}</span></p>
        <p>Current Size: <span>{{ (imageModelInstance.currentFileSize / 1048576).toFixed(2) }}</span> MB</p>
      </div>

      <div v-if="appStateInstance.showResizeFields" class="resize-fields">
        <label for="targetWidth">Width:</label>
        <input type="number" v-model="targetResolution.width" class="input-width" placeholder="Enter target width"
          @input="updateDimensions(Dimension.WIDTH)" min="1" required>
        <p v-if="targetResolution.width < 1 || isNaN(targetResolution.width)" class="error">Width must be a number
          greater than 0.</p>

        <label for="targetHeight">Height:</label>
        <input type="number" v-model="targetResolution.height" class="input-height" placeholder="Enter target height"
          @input="updateDimensions(Dimension.HEIGHT)" min="1" required>
        <p v-if="targetResolution.height < 1 || isNaN(targetResolution.height)" class="error">Height must be a number
          greater than 0.</p>

        <p v-if="targetResolution.width * targetResolution.height > 25600000" class="error">The product of width and
          height must not exceed 25,600,000.</p>

        <label>
          <input type="checkbox" v-model="appStateInstance.keepAspectRatio"> Keep Aspect Ratio
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