#!/usr/bin/env node

import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
  // Get current git commit hash
  const gitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  
  // Path to service worker
  const swPath = path.join(__dirname, '..', 'public', 'sw.js');
  
  // Read current service worker content
  let swContent = fs.readFileSync(swPath, 'utf8');
  
  // Update cache name with git hash
  const newCacheName = `golf-trip-${gitHash}`;
  swContent = swContent.replace(
    /const CACHE_NAME = ['"`]golf-trip-[^'"`]*['"`];/,
    `const CACHE_NAME = '${newCacheName}';`
  );
  
  // Write updated content back
  fs.writeFileSync(swPath, swContent);
  
  console.log(`✅ Updated service worker cache name to: ${newCacheName}`);
  
} catch (error) {
  console.error('❌ Failed to update service worker cache name:', error.message);
  process.exit(1);
}