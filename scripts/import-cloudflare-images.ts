import { PrismaClient } from '@prisma/client';
import { cloudflareImages } from '../app/lib/cloudflare';

const prisma = new PrismaClient();

async function importCloudflareImages() {
  try {
    console.log('🔍 Fetching images from Cloudflare Images...');
    
    // Fetch all images from Cloudflare
    const cloudflareImageList = await cloudflareImages.listImages();
    console.log(`📸 Found ${cloudflareImageList.length} images in Cloudflare Images`);

    if (cloudflareImageList.length === 0) {
      console.log('ℹ️  No images found in Cloudflare Images');
      return;
    }

    // Check which images are already in the database
    const existingPhotos = await prisma.photo.findMany({
      select: { cloudflareId: true }
    });
    const existingCloudflareIds = new Set(existingPhotos.map(p => p.cloudflareId));

    // Filter out images that are already imported
    const newImages = cloudflareImageList.filter(img => !existingCloudflareIds.has(img.id));
    console.log(`✨ ${newImages.length} new images to import`);

    if (newImages.length === 0) {
      console.log('✅ All Cloudflare images are already imported');
      return;
    }

    // Find the first admin user to assign as creator
    const adminUser = await prisma.user.findFirst({
      where: { isAdmin: true }
    });

    if (!adminUser) {
      console.error('❌ No admin user found. Please create an admin user first.');
      return;
    }

    console.log(`👤 Assigning images to admin user: ${adminUser.name} (${adminUser.email})`);

    // Import new images
    let importedCount = 0;
    for (const image of newImages) {
      try {
        await prisma.photo.create({
          data: {
            cloudflareId: image.id,
            url: image.url,
            caption: `Imported from Cloudflare: ${image.filename}`,
            category: 'Imported',
            createdBy: adminUser.id,
          }
        });
        importedCount++;
        console.log(`✅ Imported: ${image.filename} (${image.id})`);
      } catch (error) {
        console.error(`❌ Failed to import ${image.filename}:`, error);
      }
    }

    console.log(`\n🎉 Import completed!`);
    console.log(`📊 Summary:`);
    console.log(`   - Total Cloudflare images: ${cloudflareImageList.length}`);
    console.log(`   - Already in database: ${existingPhotos.length}`);
    console.log(`   - Newly imported: ${importedCount}`);
    console.log(`   - Failed imports: ${newImages.length - importedCount}`);

  } catch (error) {
    console.error('💥 Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importCloudflareImages();