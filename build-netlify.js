#!/usr/bin/env node

// Build script for Netlify deployment
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building for Netlify deployment...');

try {
  // Install dependencies
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  // Generate Prisma client
  console.log('🗄️ Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // Build the application
  console.log('🔨 Building application...');
  execSync('npm run build', { stdio: 'inherit' });

  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}