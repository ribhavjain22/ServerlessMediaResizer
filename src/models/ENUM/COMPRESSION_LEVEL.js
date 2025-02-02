export const COMPRESSION_LEVEL = {
    CUSTOM: 'CUSTOM',
    EXTREME: 'EXTREME',    // Maximum compression, lowest quality
    HIGH: 'HIGH',         // High compression, reduced quality
    MEDIUM: 'MEDIUM',     // Balanced compression
    LOW: 'LOW',          // Light compression, high quality
    PREPRESS: 'PREPRESS' // Minimal compression, maximum quality
};

// Define compression settings for each level
export const COMPRESSION_SETTINGS = {
    EXTREME: {
        imageResolution: 72,
        colorImageQuality: 0.3,
        grayscaleImageQuality: 0.3,
        monoImageQuality: 0.3,
        compressPages: true,
        compressFonts: true,
        downsampleImages: true
    },
    HIGH: {
        imageResolution: 100,
        colorImageQuality: 0.5,
        grayscaleImageQuality: 0.5,
        monoImageQuality: 0.5,
        compressPages: true,
        compressFonts: true,
        downsampleImages: true
    },
    MEDIUM: {
        imageResolution: 150,
        colorImageQuality: 0.7,
        grayscaleImageQuality: 0.7,
        monoImageQuality: 0.7,
        compressPages: true,
        compressFonts: true,
        downsampleImages: true
    },
    LOW: {
        imageResolution: 200,
        colorImageQuality: 0.8,
        grayscaleImageQuality: 0.8,
        monoImageQuality: 0.8,
        compressPages: true,
        compressFonts: false,
        downsampleImages: true
    },
    PREPRESS: {
        imageResolution: 300,
        colorImageQuality: 1.0,
        grayscaleImageQuality: 1.0,
        monoImageQuality: 1.0,
        compressPages: false,
        compressFonts: false,
        downsampleImages: false
    }
};