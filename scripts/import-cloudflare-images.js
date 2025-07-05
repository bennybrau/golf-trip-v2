const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Simple Node.js version without importing the TypeScript modules
async function importCloudflareImages() {
  try {
    console.log('🔍 Fetching images from Cloudflare Images...');
    
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_IMAGES_API_TOKEN;
    const urlPrefix = process.env.CLOUDFLARE_IMG_URL_PREFIX;
    
    if (!accountId || !apiToken || !urlPrefix) {
      console.error('❌ Missing required environment variables:');
      console.error('   - CLOUDFLARE_ACCOUNT_ID');
      console.error('   - CLOUDFLARE_IMAGES_API_TOKEN');
      console.error('   - CLOUDFLARE_IMG_URL_PREFIX');
      process.exit(1);
    }

    // Fetch all images from Cloudflare
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list images: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(`Cloudflare list failed: ${result.errors.map(e => e.message).join(', ')}`);
    }

    const cloudflareImageList = result.result.images.map(image => ({
      id: image.id,
      filename: image.filename,
      uploaded: image.uploaded,
      url: `${urlPrefix}${image.id}/public`
    }));

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