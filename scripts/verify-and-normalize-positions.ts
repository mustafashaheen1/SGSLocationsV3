/**
 * Script to verify and normalize project positions
 * Run with: npx ts-node scripts/verify-and-normalize-positions.ts
 */

import { verifyPositions, normalizeAllPositions } from '../lib/project-position-manager';

async function main() {
  console.log('🔍 Checking project positions...\n');

  // First, verify current state
  const verification = await verifyPositions();

  console.log('📊 Verification Results:');
  console.log('  Valid:', verification.isValid);
  console.log('  Message:', verification.message);

  if (verification.gaps.length > 0) {
    console.log('  Gaps:', verification.gaps);
  }

  if (verification.duplicates.length > 0) {
    console.log('  Duplicates:', verification.duplicates);
  }

  // If there are issues, offer to normalize
  if (!verification.isValid) {
    console.log('\n⚠️  Issues found! Normalizing positions...\n');

    const result = await normalizeAllPositions();

    console.log('✅ Normalization Results:');
    console.log('  Success:', result.success);
    console.log('  Message:', result.message);
    console.log('  Projects affected:', result.affectedCount);

    // Verify again after normalization
    console.log('\n🔍 Re-verifying after normalization...\n');
    const afterVerification = await verifyPositions();

    console.log('📊 Final Verification:');
    console.log('  Valid:', afterVerification.isValid);
    console.log('  Message:', afterVerification.message);
  } else {
    console.log('\n✅ All positions are correct! No action needed.');
  }
}

main()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
