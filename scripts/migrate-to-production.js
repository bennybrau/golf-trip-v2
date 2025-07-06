#!/usr/bin/env node

/**
 * Script to migrate data from local database to production Neon database
 * 
 * Usage: node scripts/migrate-to-production.js
 * 
 * This script will:
 * 1. Connect to local database and export all data
 * 2. Connect to production database and import the data
 * 3. Handle foreign key relationships properly
 */

import { PrismaClient } from '@prisma/client';
import readline from 'readline';

// Database URLs
const LOCAL_DATABASE_URL = "postgresql://jon.arme@localhost:5432/golf_trip_dev";
const PRODUCTION_DATABASE_URL = "postgres://neondb_owner:npg_v1LszDHl8qQf@ep-old-mud-a43i29q3-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require";

// Initialize Prisma clients
const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: LOCAL_DATABASE_URL
    }
  }
});

const prodPrisma = new PrismaClient({
  datasources: {
    db: {
      url: PRODUCTION_DATABASE_URL
    }
  }
});

async function exportLocalData() {
  console.log('📤 Exporting data from local database...');
  
  try {
    const data = {
      users: await localPrisma.user.findMany(),
      golfers: await localPrisma.golfer.findMany(),
      foursomes: await localPrisma.foursome.findMany(),
      photos: await localPrisma.photo.findMany(),
      champions: await localPrisma.champion.findMany(),
      sessions: await localPrisma.session.findMany()
    };
    
    console.log('✅ Local data exported successfully:');
    console.log(`   - Users: ${data.users.length}`);
    console.log(`   - Golfers: ${data.golfers.length}`);
    console.log(`   - Foursomes: ${data.foursomes.length}`);
    console.log(`   - Photos: ${data.photos.length}`);
    console.log(`   - Champions: ${data.champions.length}`);
    console.log(`   - Sessions: ${data.sessions.length}`);
    
    return data;
  } catch (error) {
    console.error('❌ Error exporting local data:', error);
    throw error;
  }
}

async function clearProductionData() {
  console.log('🗑️  Clearing existing production data...');
  
  try {
    // Delete in reverse dependency order to avoid foreign key constraints
    await prodPrisma.session.deleteMany();
    await prodPrisma.champion.deleteMany();
    await prodPrisma.photo.deleteMany();
    await prodPrisma.foursome.deleteMany();
    await prodPrisma.golfer.deleteMany();
    await prodPrisma.user.deleteMany();
    
    console.log('✅ Production data cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing production data:', error);
    throw error;
  }
}

async function importToProduction(data) {
  console.log('📥 Importing data to production database...');
  
  try {
    // Import in dependency order
    
    // 1. Users (no dependencies)
    console.log('   Importing users...');
    for (const user of data.users) {
      await prodPrisma.user.create({ data: user });
    }
    
    // 2. Golfers (no dependencies)
    console.log('   Importing golfers...');
    for (const golfer of data.golfers) {
      await prodPrisma.golfer.create({ data: golfer });
    }
    
    // 3. Foursomes (depends on golfers)
    console.log('   Importing foursomes...');
    for (const foursome of data.foursomes) {
      await prodPrisma.foursome.create({ data: foursome });
    }
    
    // 4. Photos (depends on users)
    console.log('   Importing photos...');
    for (const photo of data.photos) {
      await prodPrisma.photo.create({ data: photo });
    }
    
    // 5. Champions (depends on users and golfers)
    console.log('   Importing champions...');
    for (const champion of data.champions) {
      await prodPrisma.champion.create({ data: champion });
    }
    
    // 6. Sessions (depends on users)
    console.log('   Importing sessions...');
    for (const session of data.sessions) {
      await prodPrisma.session.create({ data: session });
    }
    
    console.log('✅ Data imported to production successfully');
  } catch (error) {
    console.error('❌ Error importing to production:', error);
    throw error;
  }
}

async function verifyMigration(originalData) {
  console.log('🔍 Verifying migration...');
  
  try {
    const prodData = {
      users: await prodPrisma.user.findMany(),
      golfers: await prodPrisma.golfer.findMany(),
      foursomes: await prodPrisma.foursome.findMany(),
      photos: await prodPrisma.photo.findMany(),
      champions: await prodPrisma.champion.findMany(),
      sessions: await prodPrisma.session.findMany()
    };
    
    const verificationResults = {
      users: originalData.users.length === prodData.users.length,
      golfers: originalData.golfers.length === prodData.golfers.length,
      foursomes: originalData.foursomes.length === prodData.foursomes.length,
      photos: originalData.photos.length === prodData.photos.length,
      champions: originalData.champions.length === prodData.champions.length,
      sessions: originalData.sessions.length === prodData.sessions.length
    };
    
    console.log('📊 Migration verification results:');
    Object.entries(verificationResults).forEach(([table, success]) => {
      const status = success ? '✅' : '❌';
      const localCount = originalData[table].length;
      const prodCount = prodData[table].length;
      console.log(`   ${status} ${table}: ${localCount} → ${prodCount}`);
    });
    
    const allSuccess = Object.values(verificationResults).every(Boolean);
    
    if (allSuccess) {
      console.log('🎉 Migration completed successfully!');
    } else {
      console.log('⚠️  Migration completed with discrepancies. Please review the results above.');
    }
    
    return allSuccess;
  } catch (error) {
    console.error('❌ Error verifying migration:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting database migration from local to production...\n');
  
  try {
    // Connect to databases
    console.log('🔌 Connecting to databases...');
    await localPrisma.$connect();
    await prodPrisma.$connect();
    console.log('✅ Connected to both databases\n');
    
    // Export local data
    const localData = await exportLocalData();
    console.log('');
    
    // Confirm before proceeding
    console.log('⚠️  WARNING: This will completely replace all data in the production database!');
    console.log('   Production URL:', PRODUCTION_DATABASE_URL.replace(/:[^:@]*@/, ':***@'));
    console.log('');
    
    // In a real script, you might want to add a confirmation prompt here
    // For now, we'll proceed automatically
    
    // Clear production data
    await clearProductionData();
    console.log('');
    
    // Import to production
    await importToProduction(localData);
    console.log('');
    
    // Verify migration
    await verifyMigration(localData);
    
  } catch (error) {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  } finally {
    // Disconnect from databases
    await localPrisma.$disconnect();
    await prodPrisma.$disconnect();
    console.log('\n🔌 Disconnected from databases');
  }
}

// Add confirmation prompt function
function askForConfirmation() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('Are you sure you want to proceed? This cannot be undone! (type "yes" to continue): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

// Enhanced main function with confirmation
async function mainWithConfirmation() {
  console.log('🚀 Starting database migration from local to production...\n');
  
  try {
    // Connect to databases
    console.log('🔌 Connecting to databases...');
    await localPrisma.$connect();
    await prodPrisma.$connect();
    console.log('✅ Connected to both databases\n');
    
    // Export local data first to show what will be migrated
    const localData = await exportLocalData();
    console.log('');
    
    // Show what will happen
    console.log('⚠️  WARNING: This will completely replace all data in the production database!');
    console.log('   Production URL:', PRODUCTION_DATABASE_URL.replace(/:[^:@]*@/, ':***@'));
    console.log('');
    
    // Ask for confirmation
    const confirmed = await askForConfirmation();
    
    if (!confirmed) {
      console.log('❌ Migration cancelled by user');
      return;
    }
    
    console.log('');
    
    // Proceed with migration
    await clearProductionData();
    console.log('');
    
    await importToProduction(localData);
    console.log('');
    
    await verifyMigration(localData);
    
  } catch (error) {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await localPrisma.$disconnect();
    await prodPrisma.$disconnect();
    console.log('\n🔌 Disconnected from databases');
  }
}

// Run the migration
if (import.meta.url === `file://${process.argv[1]}`) {
  mainWithConfirmation();
}

export { main, mainWithConfirmation };