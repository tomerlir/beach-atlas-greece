/* eslint-disable no-console */
import sharp from 'sharp';
import { promises as fs } from 'fs';

async function optimizeLogo() {
  console.log('🎨 Optimizing logo...\n');

  const input = 'src/assets/logo.png';
  const originalStats = await fs.stat(input);
  const originalSize = (originalStats.size / 1024).toFixed(2);
  
  console.log(`Original logo: ${originalSize} KB (112x126px)`);

  // Original dimensions: 112x126 (aspect ratio: 0.889)
  // Create sizes to match h-12 (48px) with correct aspect ratio
  // Correct width for 48px height: 48 * (112/126) = 42.67px ≈ 43px
  const sizes = [
    { width: 43, height: 48, desc: '1x (h-12 equivalent)' },
    { width: 86, height: 96, desc: '2x (retina)' },
  ];

  let totalWebpSize = 0;
  let totalAvifSize = 0;

  for (const { width, height, desc } of sizes) {
    const suffix = width === 86 ? '' : `-${width}w`;

    // Generate WebP
    const webpPath = `public/logo${suffix}.webp`;
    await sharp(input)
      .resize(width, height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 90, alphaQuality: 100 }) // Higher quality for logo
      .toFile(webpPath);

    const webpStats = await fs.stat(webpPath);
    const webpSize = (webpStats.size / 1024).toFixed(2);
    totalWebpSize += webpStats.size;
    console.log(`✅ ${webpPath} - ${webpSize} KB (${desc})`);

    // Generate AVIF
    const avifPath = `public/logo${suffix}.avif`;
    await sharp(input)
      .resize(width, height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .avif({ quality: 80 }) // AVIF handles transparency well
      .toFile(avifPath);

    const avifStats = await fs.stat(avifPath);
    const avifSize = (avifStats.size / 1024).toFixed(2);
    totalAvifSize += avifStats.size;
    console.log(`✅ ${avifPath} - ${avifSize} KB (${desc})`);
  }

  // Also copy original to public for fallback
  await fs.copyFile(input, 'public/logo.png');
  console.log(`✅ public/logo.png - ${originalSize} KB (fallback)`);

  const avgWebpSize = (totalWebpSize / sizes.length / 1024).toFixed(2);
  const avgAvifSize = (totalAvifSize / sizes.length / 1024).toFixed(2);
  const avgSavings = (((originalStats.size - totalAvifSize / sizes.length) / originalStats.size) * 100).toFixed(1);

  console.log(`\n💾 Average AVIF size: ${avgAvifSize} KB (${avgSavings}% smaller than PNG)`);
  console.log(`💾 Average WebP size: ${avgWebpSize} KB`);
  console.log('\n✨ Logo optimization complete!');
  console.log('\n📋 Next: Update Header.tsx to use optimized logo with correct aspect ratio');
}

optimizeLogo().catch((error) => {
  console.error('❌ Error optimizing logo:', error);
  process.exit(1);
});

