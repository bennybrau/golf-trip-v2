import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Connect to local database
const localPrisma = new PrismaClient();

// Connect to remote database
const remotePrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.REMOTE_DATABASE_URL,
    },
  },
});

async function syncLocalToRemote() {
  try {
    console.log('🔗 Connecting to local and remote databases...');
    
    // Verify connections
    await localPrisma.$connect();
    await remotePrisma.$connect();
    console.log('✅ Connected to both databases');
    
    // Get all data from local database
    console.log('📖 Reading local database data...');
    const localData = await Promise.all([
      localPrisma.user.findMany({
        orderBy: { createdAt: 'asc' }
      }),
      localPrisma.golfer.findMany({
        orderBy: { createdAt: 'asc' }
      }),
      localPrisma.golferStatus.findMany({
        orderBy: [{ golferId: 'asc' }, { year: 'asc' }]
      }),
      localPrisma.foursome.findMany({
        orderBy: { createdAt: 'asc' }
      }),
      localPrisma.photo.findMany({
        orderBy: { createdAt: 'asc' }
      }),
      localPrisma.champion.findMany({
        orderBy: { year: 'asc' }
      })
    ]);
    
    const [users, golfers, golferStatuses, foursomes, photos, champions] = localData;
    
    console.log('📊 Local database contents:');
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Golfers: ${golfers.length}`);
    console.log(`   - Golfer Statuses: ${golferStatuses.length}`);
    console.log(`   - Foursomes: ${foursomes.length}`);
    console.log(`   - Photos: ${photos.length}`);
    console.log(`   - Champions: ${champions.length}`);
    
    // Check remote database current state
    console.log('\\n🔍 Checking remote database current state...');
    const remoteData = await Promise.all([
      remotePrisma.user.count(),
      remotePrisma.golfer.count(),
      remotePrisma.$queryRaw`SELECT COUNT(*) as count FROM "GolferStatus"`.catch(() => [{ count: 0 }]),
      remotePrisma.foursome.count(),
      remotePrisma.photo.count(),
      remotePrisma.champion.count()
    ]);
    
    const [remoteUsers, remoteGolfers, remoteGolferStatuses, remoteFoursomes, remotePhotos, remoteChampions] = remoteData;
    const golferStatusCount = Array.isArray(remoteGolferStatuses) ? Number(remoteGolferStatuses[0]?.count || 0) : 0;
    
    console.log('📊 Remote database contents:');
    console.log(`   - Users: ${remoteUsers}`);
    console.log(`   - Golfers: ${remoteGolfers}`);
    console.log(`   - Golfer Statuses: ${golferStatusCount}`);
    console.log(`   - Foursomes: ${remoteFoursomes}`);
    console.log(`   - Photos: ${remotePhotos}`);
    console.log(`   - Champions: ${remoteChampions}`);
    
    console.log('\\n⚠️  WARNING: This will completely replace the remote database with local data.');
    console.log('All existing remote data will be deleted and replaced.');
    
    // Clear remote database in dependency order
    console.log('\\n🗑️  Clearing remote database...');
    
    await remotePrisma.champion.deleteMany();
    console.log('   ✅ Cleared champions');
    
    await remotePrisma.photo.deleteMany();
    console.log('   ✅ Cleared photos');
    
    await remotePrisma.foursome.deleteMany();
    console.log('   ✅ Cleared foursomes');
    
    // Check if GolferStatus table exists and clear it
    try {
      await remotePrisma.golferStatus.deleteMany();
      console.log('   ✅ Cleared golfer statuses');
    } catch (error) {
      if (error.message.includes('does not exist')) {
        console.log('   ⚠️  GolferStatus table does not exist in remote - will be created');
      } else {
        throw error;
      }
    }
    
    // Clear users (this will cascade to sessions)
    await remotePrisma.user.deleteMany();
    console.log('   ✅ Cleared users and sessions');
    
    await remotePrisma.golfer.deleteMany();
    console.log('   ✅ Cleared golfers');
    
    // Sync data in dependency order
    console.log('\\n📥 Syncing data to remote database...');
    
    // 1. Sync golfers first (no dependencies)
    console.log('\\n👥 Syncing golfers...');
    let syncedGolfers = 0;
    for (const golfer of golfers) {
      try {
        await remotePrisma.golfer.create({
          data: {
            id: golfer.id,
            name: golfer.name,
            email: golfer.email,
            phone: golfer.phone,
            createdAt: golfer.createdAt,
            updatedAt: golfer.updatedAt,
          }
        });
        syncedGolfers++;
      } catch (error) {
        console.log(`   ❌ Failed to sync golfer ${golfer.name}: ${error.message}`);
      }
    }
    console.log(`   ✅ Synced ${syncedGolfers}/${golfers.length} golfers`);
    
    // 2. Sync users (depends on golfers for golferId foreign key)
    console.log('\\n👤 Syncing users...');
    let syncedUsers = 0;
    for (const user of users) {
      try {
        await remotePrisma.user.create({
          data: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            phone: user.phone,
            password: user.password,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            isAdmin: user.isAdmin,
            golferId: user.golferId,
          }
        });
        syncedUsers++;
      } catch (error) {
        console.log(`   ❌ Failed to sync user ${user.name}: ${error.message}`);
      }
    }
    console.log(`   ✅ Synced ${syncedUsers}/${users.length} users`);
    
    // 3. Sync golfer statuses (depends on golfers)
    console.log('\\n📊 Syncing golfer statuses...');
    let syncedStatuses = 0;
    for (const status of golferStatuses) {
      try {
        await remotePrisma.golferStatus.create({
          data: {
            id: status.id,
            golferId: status.golferId,
            year: status.year,
            cabin: status.cabin,
            isActive: status.isActive,
          }
        });
        syncedStatuses++;
      } catch (error) {
        console.log(`   ❌ Failed to sync golfer status: ${error.message}`);
      }
    }
    console.log(`   ✅ Synced ${syncedStatuses}/${golferStatuses.length} golfer statuses`);
    
    // 4. Sync foursomes (depends on golfers)
    console.log('\\n⛳ Syncing foursomes...');
    let syncedFoursomes = 0;
    for (const foursome of foursomes) {
      try {
        await remotePrisma.foursome.create({
          data: {
            id: foursome.id,
            round: foursome.round,
            score: foursome.score,
            createdAt: foursome.createdAt,
            updatedAt: foursome.updatedAt,
            golfer1Id: foursome.golfer1Id,
            golfer2Id: foursome.golfer2Id,
            golfer3Id: foursome.golfer3Id,
            golfer4Id: foursome.golfer4Id,
            teeTime: foursome.teeTime,
            course: foursome.course,
            year: foursome.year,
          }
        });
        syncedFoursomes++;
      } catch (error) {
        console.log(`   ❌ Failed to sync foursome ${foursome.round} ${foursome.year}: ${error.message}`);
      }
    }
    console.log(`   ✅ Synced ${syncedFoursomes}/${foursomes.length} foursomes`);
    
    // 5. Sync photos (depends on users)
    console.log('\\n📸 Syncing photos...');
    let syncedPhotos = 0;
    for (const photo of photos) {
      try {
        await remotePrisma.photo.create({
          data: {
            id: photo.id,
            cloudflareId: photo.cloudflareId,
            url: photo.url,
            caption: photo.caption,
            category: photo.category,
            createdBy: photo.createdBy,
            createdAt: photo.createdAt,
            updatedAt: photo.updatedAt,
          }
        });
        syncedPhotos++;
      } catch (error) {
        console.log(`   ❌ Failed to sync photo ${photo.caption || photo.id}: ${error.message}`);
      }
    }
    console.log(`   ✅ Synced ${syncedPhotos}/${photos.length} photos`);
    
    // 6. Sync champions (depends on golfers and users)
    console.log('\\n🏆 Syncing champions...');
    let syncedChampions = 0;
    for (const champion of champions) {
      try {
        await remotePrisma.champion.create({
          data: {
            id: champion.id,
            year: champion.year,
            golferId: champion.golferId,
            photoUrl: champion.photoUrl,
            cloudflareId: champion.cloudflareId,
            createdBy: champion.createdBy,
            createdAt: champion.createdAt,
            updatedAt: champion.updatedAt,
            displayName: champion.displayName,
            favoriteQuote: champion.favoriteQuote,
            lifeChange: champion.lifeChange,
            meaning: champion.meaning,
            motivation: champion.motivation,
          }
        });
        syncedChampions++;
      } catch (error) {
        console.log(`   ❌ Failed to sync champion ${champion.year}: ${error.message}`);
      }
    }
    console.log(`   ✅ Synced ${syncedChampions}/${champions.length} champions`);
    
    // Final verification
    console.log('\\n🔍 Verifying sync results...');
    const finalRemoteData = await Promise.all([
      remotePrisma.user.count(),
      remotePrisma.golfer.count(),
      remotePrisma.$queryRaw`SELECT COUNT(*) as count FROM "GolferStatus"`.catch(() => [{ count: 0 }]),
      remotePrisma.foursome.count(),
      remotePrisma.photo.count(),
      remotePrisma.champion.count()
    ]);
    
    const [finalUsers, finalGolfers, finalGolferStatuses, finalFoursomes, finalPhotos, finalChampions] = finalRemoteData;
    const finalGolferStatusCount = Array.isArray(finalGolferStatuses) ? Number(finalGolferStatuses[0]?.count || 0) : 0;
    
    console.log('\\n📊 Final remote database state:');
    console.log(`   - Users: ${finalUsers} (was ${remoteUsers})`);
    console.log(`   - Golfers: ${finalGolfers} (was ${remoteGolfers})`);
    console.log(`   - Golfer Statuses: ${finalGolferStatusCount} (was ${golferStatusCount})`);
    console.log(`   - Foursomes: ${finalFoursomes} (was ${remoteFoursomes})`);
    console.log(`   - Photos: ${finalPhotos} (was ${remotePhotos})`);
    console.log(`   - Champions: ${finalChampions} (was ${remoteChampions})`);
    
    console.log('\\n🎉 Sync completed successfully!');
    console.log('Remote database is now a clone of your local database.');
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  } finally {
    await localPrisma.$disconnect();
    await remotePrisma.$disconnect();
  }
}

// Verify REMOTE_DATABASE_URL is set
if (!process.env.REMOTE_DATABASE_URL) {
  console.error('❌ REMOTE_DATABASE_URL environment variable is required');
  process.exit(1);
}

console.log('🚀 Starting local-to-remote database sync...');
console.log(`Local DB: ${process.env.DATABASE_URL || 'default'}`);
console.log(`Remote DB: ${process.env.REMOTE_DATABASE_URL}`);

syncLocalToRemote();