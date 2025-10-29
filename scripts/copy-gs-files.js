import { copyFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Ensure the dist/assets directory exists
const assetsDir = join(__dirname, '..', 'dist', 'assets');
mkdirSync(assetsDir, { recursive: true });

// Copy the files
const files = ['gs.js', 'gs.wasm'];
files.forEach(file => {
    const source = join(__dirname, '..', 'public', file);
    const dest = join(assetsDir, file);
    copyFileSync(source, dest);
    console.log(`Copied ${file} to dist/assets`);
});
