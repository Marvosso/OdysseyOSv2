/**
 * Generate PWA Icons (Node.js version)
 * 
 * This script generates all required PWA icon sizes using @vercel/og
 * Run with: node scripts/generate-icons.js
 * 
 * Make sure to start the dev server first: npm run dev
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
const publicDir = path.join(process.cwd(), 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      const fileStream = fs.createWriteStream(filePath);
      response.pipe(fileStream);
      
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
      
      fileStream.on('error', (err) => {
        fs.unlink(filePath, () => {});
        reject(err);
      });
    }).on('error', reject);
  });
}

async function generateIcon(size) {
  const url = `http://localhost:3000/api/og/icon?size=${size}`;
  const filePath = path.join(publicDir, `icon-${size}x${size}.png`);
  
  try {
    console.log(`Generating icon ${size}x${size}...`);
    await downloadFile(url, filePath);
    console.log(`✓ Generated ${filePath}`);
  } catch (error) {
    console.error(`✗ Failed to generate ${size}x${size}:`, error.message);
    throw error;
  }
}

async function generateAllIcons() {
  console.log('Starting icon generation...\n');
  console.log('Make sure the Next.js dev server is running on port 3000\n');
  
  for (const size of iconSizes) {
    await generateIcon(size);
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n✓ All icons generated successfully!');
  console.log(`Icons saved to: ${publicDir}`);
}

// Run if executed directly
if (require.main === module) {
  generateAllIcons().catch((error) => {
    console.error('Icon generation failed:', error);
    process.exit(1);
  });
}

module.exports = { generateAllIcons, generateIcon };
