#!/usr/bin/env node

import { execSync } from 'child_process';

console.log('\n');
console.log('═══════════════════════════════════════════════════════════════════');
console.log('⚠️  NETLIFY TEST BUILD - READ THIS CAREFULLY! ⚠️');
console.log('═══════════════════════════════════════════════════════════════════');
console.log('');
console.log('🚨 WARNING: This build is for TESTING PURPOSES ONLY!');
console.log('');
console.log('Limitations of this deployment:');
console.log('  ❌ Data changes will NOT persist');
console.log('  ❌ File uploads will be LOST on each deployment');
console.log('  ❌ JSON files reset to committed state after each build');
console.log('  ❌ User-created data disappears on every redeployment');
console.log('');
console.log('This is suitable ONLY for:');
console.log('  ✅ UI/UX testing');
console.log('  ✅ Visual design review');
console.log('  ✅ Demo purposes');
console.log('');
console.log('For production use, migrate to:');
console.log('  → Database (PostgreSQL, MongoDB, etc.)');
console.log('  → Cloud storage for uploads (S3, Cloudinary)');
console.log('  → Platform with persistent storage (Railway, Render, etc.)');
console.log('');
console.log('═══════════════════════════════════════════════════════════════════');
console.log('\n');

console.log('🔨 Starting build process...\n');

try {
  execSync('npm run build', { stdio: 'inherit' });

  console.log('\n');
  console.log('✅ Build completed successfully!');
  console.log('');
  console.log('⚠️  REMINDER: Deploy to Netlify for testing only!');
  console.log('   Data will NOT persist between deployments.');
  console.log('\n');
} catch (error) {
  console.error('\n❌ Build failed!');
  process.exit(1);
}
