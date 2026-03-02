import sharp from 'sharp';
import { promises as fs } from 'fs';

interface ImageConfig {
  input: string;
  outputName: string;
  sizes: number[];
  quality: {
    webp: number;
    avif: number;
  };
}

const images: ImageConfig[] = [
  {
    input: 'public/hero-background.png',
    outputName: 'hero-background',
    sizes: [640, 828, 1024, 1280, 1920, 2560],
    quality: { webp: 75, avif: 65 },
  },
  {
    input: 'public/area-hero.png',
    outputName: 'area-hero',
    sizes: [640, 828, 1024, 1280, 1920],
    quality: { webp: 75, avif: 65 },
  },
];

async function optimizeImages() {
  console.log('🖼️  Starting image optimization...\n');

  for (const config of images) {
    console.log(`Processing: ${config.input}`);
    
    // Get original image info
    const originalStats = await fs.stat(config.input);
    const originalSize = (originalStats.size / 1024).toFixed(2);
    console.log(`  Original size: ${originalSize} KB`);

    let totalSaved = 0;

    for (const width of config.sizes) {
      // Generate WebP
      const webpPath = `public/${config.outputName}-${width}.webp`;
      await sharp(config.input)
        .resize(width, null, {
          withoutEnlargement: true,
          fit: 'inside',
        })
        .webp({ quality: config.quality.webp })
        .toFile(webpPath);

      const webpStats = await fs.stat(webpPath);
      const webpSize = (webpStats.size / 1024).toFixed(2);
      console.log(`  ✅ ${webpPath} - ${webpSize} KB`);

      // Generate AVIF
      const avifPath = `public/${config.outputName}-${width}.avif`;
      await sharp(config.input)
        .resize(width, null, {
          withoutEnlargement: true,
          fit: 'inside',
        })
        .avif({ quality: config.quality.avif })
        .toFile(avifPath);

      const avifStats = await fs.stat(avifPath);
      const avifSize = (avifStats.size / 1024).toFixed(2);
      console.log(`  ✅ ${avifPath} - ${avifSize} KB`);

      totalSaved += originalStats.size - Math.min(webpStats.size, avifStats.size);
    }

    const savedKB = (totalSaved / config.sizes.length / 1024).toFixed(2);
    const savedPercent = ((totalSaved / config.sizes.length / originalStats.size) * 100).toFixed(1);
    console.log(`  💾 Average savings: ${savedKB} KB (${savedPercent}%)\n`);
  }

  console.log('✨ Image optimization complete!');
  console.log('\n📋 Next steps:');
  console.log('  1. Update Index.tsx to use <picture> elements');
  console.log('  2. Add preload hint for LCP image in index.html');
  console.log('  3. Test the responsive images on different screen sizes');
}

optimizeImages().catch((error) => {
  console.error('❌ Error optimizing images:', error);
  process.exit(1);
});

