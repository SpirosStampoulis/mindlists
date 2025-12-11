// Simple script to generate PWA icons
// Run with: node public/generate-icons.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a simple SVG icon
function createSVGIcon(size) {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#3b82f6"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.3}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">ML</text>
</svg>`;
}

// Note: This creates SVG files. For PNG, you'll need to:
// 1. Use the HTML generator (pwa-icon-generator.html) in a browser
// 2. Or use ImageMagick: convert icon-192.svg pwa-192x192.png
// 3. Or use an online converter

const sizes = [192, 512];
sizes.forEach(size => {
  const svg = createSVGIcon(size);
  fs.writeFileSync(path.join(__dirname, `icon-${size}.svg`), svg);
  console.log(`Created icon-${size}.svg`);
});

console.log('\nTo convert to PNG:');
console.log('1. Open public/pwa-icon-generator.html in a browser and download the PNGs');
console.log('2. Or use ImageMagick: convert icon-192.svg pwa-192x192.png');
console.log('3. Or use an online SVG to PNG converter');

