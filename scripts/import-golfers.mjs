import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function importGolfers(csvFilePath) {
  try {
    // Check if file exists
    if (!fs.existsSync(csvFilePath)) {
      console.error(`CSV file not found: ${csvFilePath}`);
      process.exit(1);
    }

    // Read the CSV file
    const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
    const lines = csvContent.trim().split('\n');
    
    if (lines.length === 0) {
      console.error('CSV file is empty');
      process.exit(1);
    }

    // Parse header line
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    console.log('CSV Headers:', headers);

    // Validate required headers
    const requiredHeaders = ['name'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      console.error(`Missing required headers: ${missingHeaders.join(', ')}`);
      console.error('Required headers: name');
      console.error('Optional headers: email, phone, cabin');
      process.exit(1);
    }

    // Process each row
    const golfers = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      if (values.length !== headers.length) {
        console.warn(`Line ${i + 1}: Column count mismatch, skipping`);
        continue;
      }

      const golfer = {};
      headers.forEach((header, index) => {
        const value = values[index];
        
        switch (header) {
          case 'name':
            golfer.name = value;
            break;
          case 'email':
            golfer.email = value || null;
            break;
          case 'phone':
            golfer.phone = value || null;
            break;
          case 'cabin':
            golfer.cabin = value ? parseInt(value) : null;
            break;
          default:
            console.warn(`Unknown header: ${header}, ignoring`);
        }
      });

      // Validate required fields
      if (!golfer.name) {
        console.warn(`Line ${i + 1}: Missing name, skipping`);
        continue;
      }

      golfers.push(golfer);
    }

    console.log(`Found ${golfers.length} valid golfers to import`);

    if (golfers.length === 0) {
      console.log('No valid golfers found to import');
      return;
    }

    // Check for existing golfers
    const existingGolfers = await prisma.golfer.findMany({
      where: {
        name: {
          in: golfers.map(g => g.name)
        }
      },
      select: { name: true }
    });

    const existingNames = new Set(existingGolfers.map(g => g.name));
    const newGolfers = golfers.filter(g => !existingNames.has(g.name));
    const duplicateGolfers = golfers.filter(g => existingNames.has(g.name));

    if (duplicateGolfers.length > 0) {
      console.log(`Found ${duplicateGolfers.length} golfers that already exist:`);
      duplicateGolfers.forEach(g => console.log(`  - ${g.name}`));
    }

    if (newGolfers.length === 0) {
      console.log('All golfers already exist in the database');
      return;
    }

    console.log(`Importing ${newGolfers.length} new golfers...`);

    // Import new golfers
    const result = await prisma.golfer.createMany({
      data: newGolfers,
      skipDuplicates: true
    });

    console.log(`Successfully imported ${result.count} golfers`);

    // Show summary
    console.log('\nImport Summary:');
    console.log(`- Total rows processed: ${lines.length - 1}`);
    console.log(`- Valid golfers found: ${golfers.length}`);
    console.log(`- Already existing: ${duplicateGolfers.length}`);
    console.log(`- Successfully imported: ${result.count}`);

  } catch (error) {
    console.error('Error importing golfers:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get CSV file path from command line arguments
const csvFilePath = process.argv[2];

if (!csvFilePath) {
  console.error('Usage: node scripts/import-golfers.mjs <path-to-csv-file>');
  console.error('');
  console.error('CSV format should have headers:');
  console.error('name,email,phone,cabin');
  console.error('');
  console.error('Example:');
  console.error('name,email,phone,cabin');
  console.error('John Doe,john@example.com,555-0123,1');
  console.error('Jane Smith,jane@example.com,555-0456,2');
  process.exit(1);
}

// Run the import
importGolfers(csvFilePath);