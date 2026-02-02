/**
 * Generate PWA Icons
 * 
 * This script generates all required PWA icon sizes using @vercel/og
 * Run with: npx tsx scripts/generate-icons.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
const publicDir = path.join(process.cwd(), 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

async function generateIcon(size: number): Promise<void> {
  const url = `http://localhost:3000/api/og/icon?size=${size}`;
  
  try {
    console.log(`Generating icon ${size}x${size}...`);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to generate icon: ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();
    const filePath = path.join(publicDir, `icon-${size}x${size}.png`);
    
    fs.writeFileSync(filePath, Buffer.from(buffer));
    console.log(`✓ Generated ${filePath}`);
  } catch (error) {
    console.error(`✗ Failed to generate ${size}x${size}:`, error);
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

export { generateAllIcons, generateIcon };
