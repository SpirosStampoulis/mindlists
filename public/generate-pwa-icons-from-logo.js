// Script to generate PWA icons from logo-icon.png
// Run with: node public/generate-pwa-icons-from-logo.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname);
const logoPath = path.join(publicDir, 'logo-icon.png');

// Check if logo-icon.png exists
if (!fs.existsSync(logoPath)) {
  console.error('Error: logo-icon.png not found in public folder');
  console.log('Please make sure logo-icon.png exists in the public folder');
  process.exit(1);
}

console.log('Found logo-icon.png');
console.log('\nTo generate PWA icons from your logo, you have two options:\n');

console.log('Option 1: Using ImageMagick (if installed):');
console.log('  cd public');
console.log('  convert logo-icon.png -resize 192x192 pwa-192x192.png');
console.log('  convert logo-icon.png -resize 512x512 pwa-512x512.png\n');

console.log('Option 2: Using an online tool or image editor:');
console.log('  - Resize logo-icon.png to 192x192 pixels and save as pwa-192x192.png');
console.log('  - Resize logo-icon.png to 512x512 pixels and save as pwa-512x512.png');
console.log('  - Place both files in the public folder\n');

console.log('Option 3: Using Node.js with sharp (if installed):');
console.log('  npm install sharp --save-dev');
console.log('  Then run this script again\n');

// Try to use sharp if available
try {
  const sharp = await import('sharp');
  
  console.log('Generating PWA icons with sharp...\n');
  
  const sizes = [192, 512];
  
  for (const size of sizes) {
    const outputPath = path.join(publicDir, `pwa-${size}x${size}.png`);
    
    await sharp.default(logoPath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(outputPath);
    
    console.log(`✓ Generated pwa-${size}x${size}.png`);
  }
  
  console.log('\n✓ All PWA icons generated successfully!');
} catch (err) {
  if (err.code === 'MODULE_NOT_FOUND') {
    console.log('Sharp not found. Please use one of the options above.');
  } else {
    console.error('Error generating icons:', err.message);
  }
}

