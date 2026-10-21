import mongoose from 'mongoose';
import { ENV } from '../config/env.js';
import { Product } from '../models/Product.js';
import { Store } from '../models/Store.js';
import { lookupProductImage } from '../services/imageLookupService.js';

export interface PopulationReport {
  totalProcessed: number;
  matchedCount: number;
  skippedMerchantCount: number;
  manualReviewNeeded: Array<{ id: string; name: string; brand: string; store: string }>;
  successItems: Array<{ id: string; name: string; brand: string; source: string; barcode?: string }>;
}

export async function populateRealProductImages(): Promise<PopulationReport> {
  // Ensure Store model is registered in mongoose instance
  if (!mongoose.models['Store']) {
    const _ = Store;
  }
  const products = await Product.find({}).populate('storeId', 'name slug');
  console.log(`[Image Population] Processing ${products.length} products...`);

  const report: PopulationReport = {
    totalProcessed: products.length,
    matchedCount: 0,
    skippedMerchantCount: 0,
    manualReviewNeeded: [],
    successItems: []
  };

  for (const product of products) {
    // 1. Never overwrite verified merchant uploads
    if (product.imageSource === 'merchant' && product.imageVerified) {
      report.skippedMerchantCount++;
      continue;
    }

    // 2. Perform intelligent lookup (Barcode > Open Food Facts API > Verified Catalog)
    const result = await lookupProductImage({
      name: product.name,
      brand: product.brand,
      variant: product.variant,
      unit: product.unit,
      barcode: product.barcode,
      category: product.category
    });

    if (result && result.imageUrl) {
      product.imageUrl = result.imageUrl;
      product.image = result.imageUrl;
      product.imageSource = result.imageSource;
      product.imageAttribution = result.imageAttribution;
      product.imageLicense = result.imageLicense;
      product.imageVerified = true;
      if (result.barcode && !product.barcode) {
        product.barcode = result.barcode;
      }

      await product.save();
      report.matchedCount++;
      report.successItems.push({
        id: product._id.toString(),
        name: product.name,
        brand: product.brand,
        source: result.imageSource,
        barcode: result.barcode
      });
      console.log(`✓ Matched: "${product.name}" -> ${result.imageSource} (${result.barcode || 'catalog'})`);
    } else {
      report.manualReviewNeeded.push({
        id: product._id.toString(),
        name: product.name,
        brand: product.brand,
        store: (product.storeId as any)?.name || 'Unknown'
      });
      console.log(`⚠ Requires Review: "${product.name}" [${product.brand}]`);
    }
  }

  return report;
}

// Execute standalone if run directly
if (process.argv[1]?.endsWith('populateRealProductImages.ts') || process.argv[1]?.endsWith('populateRealProductImages.js')) {
  mongoose
    .connect(ENV.MONGODB_URI)
    .then(async () => {
      const report = await populateRealProductImages();
      console.log('\n=============================================');
      console.log('REAL PRODUCT IMAGE POPULATION REPORT');
      console.log('=============================================');
      console.log(`Total Products Processed: ${report.totalProcessed}`);
      console.log(`Successfully Matched Real Photos: ${report.matchedCount}`);
      console.log(`Protected Merchant Uploads: ${report.skippedMerchantCount}`);
      console.log(`Manual Review Required: ${report.manualReviewNeeded.length}`);
      console.log('=============================================\n');
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal error during image population:', err);
      process.exit(1);
    });
}
