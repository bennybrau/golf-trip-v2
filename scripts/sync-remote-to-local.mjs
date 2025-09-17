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

async function syncRemoteToLocal() {
  try {
    console.log('🔗 Connecting to remote and local databases...');
    
    // Verify connections
    await remotePrisma.$connect();
    await localPrisma.$connect();
    console.log('✅ Connected to both databases');
    
    // Get all data from remote database
    console.log('📖 Reading remote database data...');
    const remoteData = await Promise.all([
      remotePrisma.user.findMany({
        orderBy: { createdAt: 'asc' }
      }),
      remotePrisma.golfer.findMany({
        orderBy: { createdAt: 'asc' }
      }),
      remotePrisma.golferStatus.findMany({
        orderBy: [{ golferId: 'asc' }, { year: 'asc' }]
      }),
      remotePrisma.foursome.findMany({
        orderBy: { createdAt: 'asc' }
      }),
      remotePrisma.photo.findMany({
        orderBy: { createdAt: 'asc' }
      }),
      remotePrisma.champion.findMany({
        orderBy: { year: 'asc' }
      })
    ]);
    
    const [users, golfers, golferStatuses, foursomes, photos, champions] = remoteData;
    
    console.log('📊 Remote database contents:');
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Golfers: ${golfers.length}`);
    console.log(`   - Golfer Statuses: ${golferStatuses.length}`);
    console.log(`   - Foursomes: ${foursomes.length}`);
    console.log(`   - Photos: ${photos.length}`);
    console.log(`   - Champions: ${champions.length}`);
    
    // Check local database current state
    console.log('\n🔍 Checking local database current state...');
    const localData = await Promise.all([
      localPrisma.user.count(),
      localPrisma.golfer.count(),
      localPrisma.golferStatus.count(),
      localPrisma.foursome.count(),
      localPrisma.photo.count(),
      localPrisma.champion.count()
    ]);
    
    const [localUsers, localGolfers, localGolferStatuses, localFoursomes, localPhotos, localChampions] = localData;
    
    console.log('📊 Local database contents:');
    console.log(`   - Users: ${localUsers}`);
    console.log(`   - Golfers: ${localGolfers}`);
    console.log(`   - Golfer Statuses: ${localGolferStatuses}`);
    console.log(`   - Foursomes: ${localFoursomes}`);
    console.log(`   - Photos: ${localPhotos}`);
    console.log(`   - Champions: ${localChampions}`);
    
    console.log('\n⚠️  WARNING: This will completely replace your local database with production data.');
    console.log('All existing local data will be deleted and replaced.');
    console.log('\n⏸️  Press Ctrl+C to cancel or wait 5 seconds to continue...');
    
    // Give user 5 seconds to cancel
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('\n🚀 Starting sync...');
    
    // Create backup of current local data
    console.log('\n💾 Creating backup of current local data...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'raw-backups', `backup-${timestamp}`);
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const localBackupData = await Promise.all([
      localPrisma.user.findMany(),
      localPrisma.golfer.findMany(),
      localPrisma.golferStatus.findMany(),
      localPrisma.foursome.findMany(),
      localPrisma.photo.findMany(),
      localPrisma.champion.findMany()
    ]);
    
    const [backupUsers, backupGolfers, backupGolferStatuses, backupFoursomes, backupPhotos, backupChampions] = localBackupData;
    
    // Save backup files
    fs.writeFileSync(path.join(backupDir, 'User.json'), JSON.stringify(backupUsers, null, 2));
    fs.writeFileSync(path.join(backupDir, 'Golfer.json'), JSON.stringify(backupGolfers, null, 2));
    fs.writeFileSync(path.join(backupDir, 'GolferStatus.json'), JSON.stringify(backupGolferStatuses, null, 2));
    fs.writeFileSync(path.join(backupDir, 'Foursome.json'), JSON.stringify(backupFoursomes, null, 2));
    fs.writeFileSync(path.join(backupDir, 'Photo.json'), JSON.stringify(backupPhotos, null, 2));
    fs.writeFileSync(path.join(backupDir, 'Champion.json'), JSON.stringify(backupChampions, null, 2));
    
    const backupSummary = `Backup created: ${timestamp}
Local database backup before sync from production

Original counts:
- Users: ${localUsers}
- Golfers: ${localGolfers}
- Golfer Statuses: ${localGolferStatuses}
- Foursomes: ${localFoursomes}
- Photos: ${localPhotos}
- Champions: ${localChampions}

New counts from production:
- Users: ${users.length}
- Golfers: ${golfers.length}
- Golfer Statuses: ${golferStatuses.length}
- Foursomes: ${foursomes.length}
- Photos: ${photos.length}
- Champions: ${champions.length}
`;
    
    fs.writeFileSync(path.join(backupDir, 'backup-summary.txt'), backupSummary);
    console.log(`   ✅ Backup saved to: ${backupDir}`);
    
    // Clear local database in dependency order
    console.log('\n🗑️  Clearing local database...');
    
    await localPrisma.champion.deleteMany();
    console.log('   ✅ Cleared champions');
    
    await localPrisma.photo.deleteMany();
    console.log('   ✅ Cleared photos');
    
    await localPrisma.foursome.deleteMany();
    console.log('   ✅ Cleared foursomes');
    
    await localPrisma.golferStatus.deleteMany();
    console.log('   ✅ Cleared golfer statuses');
    
    // Clear users (this will cascade to sessions and password reset tokens)
    await localPrisma.user.deleteMany();
    console.log('   ✅ Cleared users, sessions, and password reset tokens');
    
    await localPrisma.golfer.deleteMany();
    console.log('   ✅ Cleared golfers');
    
    // Sync data in dependency order
    console.log('\n📥 Syncing production data to local database...');
    
    // 1. Sync golfers first (no dependencies)
    console.log('\n👥 Syncing golfers...');
    let syncedGolfers = 0;
    for (const golfer of golfers) {
      try {
        await localPrisma.golfer.create({
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
    console.log('\n👤 Syncing users...');
    let syncedUsers = 0;
    for (const user of users) {
      try {
        await localPrisma.user.create({
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
    console.log('\n📊 Syncing golfer statuses...');
    let syncedStatuses = 0;
    for (const status of golferStatuses) {
      try {
        await localPrisma.golferStatus.create({
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
    console.log('\n⛳ Syncing foursomes...');
    let syncedFoursomes = 0;
    for (const foursome of foursomes) {
      try {
        await localPrisma.foursome.create({
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
    console.log('\n📸 Syncing photos...');
    let syncedPhotos = 0;
    for (const photo of photos) {
      try {
        await localPrisma.photo.create({
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
    console.log('\n🏆 Syncing champions...');
    let syncedChampions = 0;
    for (const champion of champions) {
      try {
        await localPrisma.champion.create({
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
    console.log('\n🔍 Verifying sync results...');
    const finalLocalData = await Promise.all([
      localPrisma.user.count(),
      localPrisma.golfer.count(),
      localPrisma.golferStatus.count(),
      localPrisma.foursome.count(),
      localPrisma.photo.count(),
      localPrisma.champion.count()
    ]);
    
    const [finalUsers, finalGolfers, finalGolferStatuses, finalFoursomes, finalPhotos, finalChampions] = finalLocalData;
    
    console.log('\n📊 Final local database state:');
    console.log(`   - Users: ${finalUsers} (was ${localUsers})`);
    console.log(`   - Golfers: ${finalGolfers} (was ${localGolfers})`);
    console.log(`   - Golfer Statuses: ${finalGolferStatuses} (was ${localGolferStatuses})`);
    console.log(`   - Foursomes: ${finalFoursomes} (was ${localFoursomes})`);
    console.log(`   - Photos: ${finalPhotos} (was ${localPhotos})`);
    console.log(`   - Champions: ${finalChampions} (was ${localChampions})`);
    
    console.log('\n🎉 Sync completed successfully!');
    console.log('Local database is now a clone of your production database.');
    console.log(`💾 Backup of original local data saved to: ${backupDir}`);
    
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
  console.error('Set it to your production database URL:');
  console.error('export REMOTE_DATABASE_URL="postgresql://user:password@host:port/database"');
  process.exit(1);
}

console.log('🚀 Starting production-to-local database sync...');
console.log(`Local DB: ${process.env.DATABASE_URL || 'default'}`);
console.log(`Production DB: ${process.env.REMOTE_DATABASE_URL}`);

syncRemoteToLocal();