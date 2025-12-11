#!/bin/bash
# Simple script to generate PWA icons using ImageMagick (if available)
# Or use the HTML generator: open public/pwa-icon-generator.html in a browser

if command -v convert &> /dev/null; then
  # Generate 192x192 icon
  convert -size 192x192 xc:#3b82f6 -gravity center -pointsize 60 -fill white -annotate +0+0 "ML" public/pwa-192x192.png
  
  # Generate 512x512 icon
  convert -size 512x512 xc:#3b82f6 -gravity center -pointsize 160 -fill white -annotate +0+0 "ML" public/pwa-512x512.png
  
  echo "Icons generated successfully!"
else
  echo "ImageMagick not found. Please:"
  echo "1. Install ImageMagick, or"
  echo "2. Open public/pwa-icon-generator.html in a browser to generate icons"
fi
