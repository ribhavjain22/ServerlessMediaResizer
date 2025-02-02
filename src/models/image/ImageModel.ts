import { LogError } from '@/helpers/LogHelper/LogError';
import { ImageResolution } from './ImageResolution';


export class ImageData {

  currentImageSrc: string;
  currentFileSize: number;
  currentFileName: string;
  currentResolution: ImageResolution;

  // The constructor initializes the ImageData instance and returns a Promise
  constructor(file: File) {
    this.currentFileSize = file.size; // Store the file size
    this.currentFileName = file.name; // Store the file name

    const reader = new FileReader(); // Create a FileReader to read the file

    // Return a Promise that will be resolved or rejected based on the file reading and image loading process
    return new Promise((resolve, reject) => {
      // Define what happens when the FileReader successfully reads the file
      reader.onload = (e) => {
        const img = new Image(); // Create an Image object to load and process the image data

        // Define what happens when the Image object successfully loads the image
        img.onload = () => {
          try {
            // Set the image resolution (width and height)
            this.currentResolution = new ImageResolution(img.width, img.height);
            // Set the image source to the result of the FileReader
            this.currentImageSrc = e.target?.result as string;

            // Successfully resolve the Promise with this ImageData instance
            resolve(this);
          } catch (error) {
            // If there is an error, log it and reject the Promise
            LogError(error, this.currentFileName);
            reject(error);
          }
        };

        // Define what happens if there is an error loading the image
        img.onerror = () => {
          const error = new Error("Invalid image file."); // Create a new error message
          LogError(error, this.currentFileName); // Log the error
          reject(error); // Reject the Promise with the error
        };

        // Set the image source to the result of the FileReader (this starts loading the image)
        img.src = e.target?.result as string;
      };

      // Define what happens if there is an error reading the file
      reader.onerror = () => {
        const error = new Error("Error reading file."); // Create a new error message
        LogError(error, this.currentFileName); // Log the error
        reject(error); // Reject the Promise with the error
      };

      // Start reading the file as a data URL (this triggers the onload or onerror events)
      reader.readAsDataURL(file);
    });
  }
}