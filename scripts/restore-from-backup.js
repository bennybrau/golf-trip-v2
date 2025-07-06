#!/usr/bin/env node

/**
 * Script to restore database data from a backup JSON file
 * 
 * Usage: node scripts/restore-from-backup.js <backup-file> [target-database]
 * 
 * target-database can be 'local' or 'production' (defaults to production)
 */

import { PrismaClient } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';
import readline from 'readline';

const LOCAL_DATABASE_URL = "postgresql://jon.arme@localhost:5432/golf_trip_dev";
const PRODUCTION_DATABASE_URL = "postgres://neondb_owner:npg_v1LszDHl8qQf@ep-old-mud-a43i29q3-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function restoreFromBackup(backupFile, targetDatabase = 'production') {
  console.log(`📥 Restoring data to ${targetDatabase} database from backup...`);
  
  const databaseUrl = targetDatabase === 'local' ? LOCAL_DATABASE_URL : PRODUCTION_DATABASE_URL;
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    }
  });
  
  try {
    await prisma.$connect();
    
    // Read backup file
    const backupPath = path.resolve(backupFile);
    const backupContent = await fs.readFile(backupPath, 'utf8');
    const data = JSON.parse(backupContent);
    
    console.log(`📄 Backup file: ${backupPath}`);
    console.log(`📅 Backup timestamp: ${data.timestamp}`);
    console.log('📊 Backup contents:');
    console.log(`   - Users: ${data.users?.length || 0}`);
    console.log(`   - Golfers: ${data.golfers?.length || 0}`);
    console.log(`   - Foursomes: ${data.foursomes?.length || 0}`);
    console.log(`   - Photos: ${data.photos?.length || 0}`);
    console.log(`   - Champions: ${data.champions?.length || 0}`);
    console.log(`   - Sessions: ${data.sessions?.length || 0}`);
    console.log('');
    
    // Ask for confirmation
    const confirmed = await askForConfirmation(`restore to ${targetDatabase}`);
    
    if (!confirmed) {
      console.log('❌ Restore cancelled by user');
      return;
    }
    
    console.log('');
    
    // Clear existing data
    console.log(`🗑️  Clearing existing ${targetDatabase} data...`);
    await prisma.session.deleteMany();
    await prisma.champion.deleteMany();
    await prisma.photo.deleteMany();
    await prisma.foursome.deleteMany();
    await prisma.golfer.deleteMany();
    await prisma.user.deleteMany();
    console.log('✅ Existing data cleared');
    console.log('');
    
    // Restore data in dependency order
    console.log('📥 Importing backup data...');
    
    // 1. Users
    if (data.users?.length) {
      console.log('   Importing users...');
      for (const user of data.users) {
        await prisma.user.create({ data: user });
      }
    }
    
    // 2. Golfers
    if (data.golfers?.length) {
      console.log('   Importing golfers...');
      for (const golfer of data.golfers) {
        await prisma.golfer.create({ data: golfer });
      }
    }
    
    // 3. Foursomes
    if (data.foursomes?.length) {
      console.log('   Importing foursomes...');
      for (const foursome of data.foursomes) {
        await prisma.foursome.create({ data: foursome });
      }
    }
    
    // 4. Photos
    if (data.photos?.length) {
      console.log('   Importing photos...');
      for (const photo of data.photos) {
        await prisma.photo.create({ data: photo });
      }
    }
    
    // 5. Champions
    if (data.champions?.length) {
      console.log('   Importing champions...');
      for (const champion of data.champions) {
        await prisma.champion.create({ data: champion });
      }
    }
    
    // 6. Sessions
    if (data.sessions?.length) {
      console.log('   Importing sessions...');
      for (const session of data.sessions) {
        await prisma.session.create({ data: session });
      }
    }
    
    console.log('✅ Data restored successfully');
    
    // Verify restoration
    console.log('');
    console.log('🔍 Verifying restoration...');
    const restoredData = {
      users: await prisma.user.findMany(),
      golfers: await prisma.golfer.findMany(),
      foursomes: await prisma.foursome.findMany(),
      photos: await prisma.photo.findMany(),
      champions: await prisma.champion.findMany(),
      sessions: await prisma.session.findMany()
    };
    
    console.log('📊 Restoration verification:');
    console.log(`   - Users: ${data.users?.length || 0} → ${restoredData.users.length}`);
    console.log(`   - Golfers: ${data.golfers?.length || 0} → ${restoredData.golfers.length}`);
    console.log(`   - Foursomes: ${data.foursomes?.length || 0} → ${restoredData.foursomes.length}`);
    console.log(`   - Photos: ${data.photos?.length || 0} → ${restoredData.photos.length}`);
    console.log(`   - Champions: ${data.champions?.length || 0} → ${restoredData.champions.length}`);
    console.log(`   - Sessions: ${data.sessions?.length || 0} → ${restoredData.sessions.length}`);
    
    console.log('🎉 Restoration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error restoring from backup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

function askForConfirmation(action) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question(`⚠️  WARNING: This will completely replace all data in the target database!\nAre you sure you want to ${action}? This cannot be undone! (type "yes" to continue): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node scripts/restore-from-backup.js <backup-file> [target-database]');
    console.log('');
    console.log('Arguments:');
    console.log('  backup-file      Path to the backup JSON file');
    console.log('  target-database  "local" or "production" (default: production)');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/restore-from-backup.js backups/backup-2024-01-01.json');
    console.log('  node scripts/restore-from-backup.js backups/backup-2024-01-01.json local');
    process.exit(1);
  }
  
  const backupFile = args[0];
  const targetDatabase = args[1] || 'production';
  
  if (!['local', 'production'].includes(targetDatabase)) {
    console.error('❌ Invalid target database. Must be "local" or "production"');
    process.exit(1);
  }
  
  try {
    await restoreFromBackup(backupFile, targetDatabase);
  } catch (error) {
    console.error('💥 Restore failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { restoreFromBackup };