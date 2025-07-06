#!/usr/bin/env node

/**
 * Script to backup local database data to a JSON file
 * 
 * Usage: node scripts/backup-local-data.js [filename]
 * 
 * If no filename is provided, it will use a timestamp-based name
 */

import { PrismaClient } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCAL_DATABASE_URL = "postgresql://jon.arme@localhost:5432/golf_trip_dev";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: LOCAL_DATABASE_URL
    }
  }
});

async function backupData(filename) {
  console.log('📤 Backing up local database data...');
  
  try {
    await prisma.$connect();
    
    const data = {
      timestamp: new Date().toISOString(),
      users: await prisma.user.findMany(),
      golfers: await prisma.golfer.findMany(),
      foursomes: await prisma.foursome.findMany(),
      photos: await prisma.photo.findMany(),
      champions: await prisma.champion.findMany(),
      sessions: await prisma.session.findMany()
    };
    
    // Ensure backups directory exists
    const backupsDir = path.join(__dirname, '../backups');
    try {
      await fs.mkdir(backupsDir, { recursive: true });
    } catch (err) {
      // Directory might already exist
    }
    
    const backupPath = path.join(backupsDir, filename);
    await fs.writeFile(backupPath, JSON.stringify(data, null, 2));
    
    console.log('✅ Backup completed successfully:');
    console.log(`   - File: ${backupPath}`);
    console.log(`   - Users: ${data.users.length}`);
    console.log(`   - Golfers: ${data.golfers.length}`);
    console.log(`   - Foursomes: ${data.foursomes.length}`);
    console.log(`   - Photos: ${data.photos.length}`);
    console.log(`   - Champions: ${data.champions.length}`);
    console.log(`   - Sessions: ${data.sessions.length}`);
    
    return backupPath;
  } catch (error) {
    console.error('❌ Error creating backup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const filename = args[0] || `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  
  try {
    await backupData(filename);
  } catch (error) {
    console.error('💥 Backup failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { backupData };