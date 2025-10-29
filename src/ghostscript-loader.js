// Import the Ghostscript files as assets
import gsJs from '../public/gs.js?url';
import gsWasm from '../public/gs.wasm?url';

export async function loadGhostscript() {
    try {
        // Set the WASM URL for Ghostscript
        window.gsWasmUrl = gsWasm;

        // Dynamically import the Ghostscript JS module
        const gsModule = await import(/* @vite-ignore */ gsJs);
        return gsModule.default;
    } catch (error) {
        console.error('Failed to load Ghostscript:', error);
        throw error;
    }
}
