export async function loadGhostscript() {
    try {
        // Copy gs.wasm to public directory during development
        if (import.meta.env.DEV) {
            await fetch('/public/gs.wasm')
                .then(response => response.arrayBuffer())
                .then(buffer => {
                    const blob = new Blob([buffer], { type: 'application/wasm' });
                    window.gsWasmUrl = URL.createObjectURL(blob);
                });
        }

        // In production, the file will be in the assets directory
        const gsModule = await import('/gs.js');
        return gsModule.default;
    } catch (error) {
        console.error('Failed to load Ghostscript:', error);
        throw error;
    }
}
