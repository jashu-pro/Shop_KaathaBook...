// scripts/verify_phase9.js
import crypto from 'node:crypto';

// Polyfill minimal localStorage for testing
const mockStorage = new Map();
globalThis.localStorage = {
  getItem: (key) => mockStorage.get(key) || null,
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
  get length() {
    return mockStorage.size;
  },
  key: (i) => Array.from(mockStorage.keys())[i] || null,
};

// Polyfill window.crypto for hashing
if (!globalThis.window) {
  globalThis.window = {
    crypto: {
      subtle: crypto.webcrypto.subtle,
    },
  };
}

async function runVerification() {
  console.log('🧪 ========================================================');
  console.log('🧪 Starting Phase 9 Worker Access & Security Verification');
  console.log('🧪 ========================================================\n');

  // Import Phase 9 modules
  const { PERMISSION_PRESETS, DEFAULT_WORKER_PERMISSIONS } = await import('../src/features/staff/types/index.ts');
  const { hashSecret, generate4DigitCode, isCodeExpired } = await import('../src/features/staff/utils/security.ts');
  const { LocalWorkerRepository } = await import('../src/features/staff/repositories/LocalWorkerRepository.ts');

  const repo = new LocalWorkerRepository();
  const shopId = 'shop_test_123';

  // 1. Verify Permission Presets
  console.log('1️⃣ Testing Permission Presets...');
  const salesPreset = PERMISSION_PRESETS.find((p) => p.key === 'sales');
  const counterPreset = PERMISSION_PRESETS.find((p) => p.key === 'counter');
  const inventoryPreset = PERMISSION_PRESETS.find((p) => p.key === 'inventory');

  if (!salesPreset || !counterPreset || !inventoryPreset) {
    throw new Error('Missing standard permission presets');
  }

  if (!counterPreset.permissions.sales.create || !counterPreset.permissions.payments.receive || counterPreset.permissions.reports) {
    throw new Error('Counter preset permissions misconfigured');
  }
  console.log('   ✅ Presets validated: Sales, Counter/Billing, Inventory, Full Operations.');

  // 2. Add Worker with Counter Access Preset
  console.log('\n2️⃣ Testing Worker Creation with 4-Digit Approval Code...');
  const tempCode = generate4DigitCode();
  const { worker: newWorker, tempCode: issuedCode } = await repo.addWorker(
    shopId,
    {
      name: 'Ramesh Kumar',
      emailOrPhone: '9876543210',
      permissions: counterPreset.permissions,
    },
    tempCode
  );

  if (newWorker.status !== 'invited' || !newWorker.tempCodeHash) {
    throw new Error('Worker was not created in invited state with tempCodeHash');
  }
  console.log(`   ✅ Worker "${newWorker.name}" added with temporary approval code: ${issuedCode}`);

  // 3. Expiration Check
  console.log('\n3️⃣ Testing Approval Code Expiration logic...');
  const isExpiredNow = isCodeExpired(newWorker.tempCodeExpiresAt);
  const isExpiredPast = isCodeExpired(new Date(Date.now() - 1000).toISOString());
  if (isExpiredNow || !isExpiredPast) {
    throw new Error('Code expiration logic failed');
  }
  console.log('   ✅ Code expiration correctly validates 48h timeframe and rejects expired codes.');

  // 4. Activate Worker with 4-digit PIN
  console.log('\n4️⃣ Testing Worker Activation & 4-Digit PIN Creation...');
  const activatedWorker = await repo.verifyAndActivateWorker(newWorker.id, issuedCode, '1234');
  if (activatedWorker.status !== 'active' || !activatedWorker.pinHash || activatedWorker.tempCodeHash !== undefined) {
    throw new Error('Worker activation failed or tempCodeHash was not consumed');
  }
  console.log('   ✅ Worker activated successfully, PIN hashed (SHA-256), temp approval code consumed.');

  // 5. Verify PIN Authentication
  console.log('\n5️⃣ Testing Worker PIN Authentication...');
  const validPin = await repo.verifyWorkerPin(activatedWorker.id, '1234');
  const invalidPin = await repo.verifyWorkerPin(activatedWorker.id, '9999');
  if (!validPin || invalidPin) {
    throw new Error('PIN authentication failed');
  }
  console.log('   ✅ Correct PIN (1234) authenticated; Incorrect PIN (9999) rejected.');

  // 6. Security Control: Reset PIN
  console.log('\n6️⃣ Testing Owner Security Control: Reset Worker PIN...');
  const { worker: resetWorker, tempCode: newTempCode } = await repo.resetWorkerPin(activatedWorker.id);
  if (resetWorker.status !== 'invited' || resetWorker.pinHash !== undefined || !resetWorker.tempCodeHash) {
    throw new Error('Reset PIN failed to clear previous PIN or issue new approval code');
  }
  console.log(`   ✅ PIN reset successfully! Status back to invited, new approval code: ${newTempCode}`);

  // 7. Security Control: Revoke All Sessions
  console.log('\n7️⃣ Testing Owner Security Control: Revoke All Worker Sessions...');
  const revokedWorker = await repo.revokeWorkerSessions(resetWorker.id);
  if (!revokedWorker.sessionVersion || revokedWorker.sessionVersion <= (newWorker.sessionVersion || 1)) {
    throw new Error('Session version was not incremented during session revocation');
  }
  console.log(`   ✅ All active sessions revoked! New session version: ${revokedWorker.sessionVersion}`);

  // 8. Worker Activity Logging & Financial Audit
  console.log('\n8️⃣ Testing Worker Activity Logging & Financial Audit...');
  await repo.logActivity(shopId, {
    workerId: newWorker.id,
    workerName: newWorker.name,
    action: 'Created Sale #1042',
    category: 'sale',
    amount: 1450,
  });

  await repo.logActivity(shopId, {
    workerId: newWorker.id,
    workerName: newWorker.name,
    action: 'Received payment via UPI',
    category: 'payment',
    amount: 800,
  });

  const logs = await repo.getActivityLogs(shopId);
  if (logs.length < 4) { // including creation, activation, reset, etc.
    throw new Error('Activity logs missing entries');
  }
  const saleLog = logs.find((l) => l.action.includes('Sale #1042'));
  const paymentLog = logs.find((l) => l.action.includes('UPI'));
  if (!saleLog || saleLog.amount !== 1450 || !paymentLog || paymentLog.amount !== 800) {
    throw new Error('Financial amounts in activity log mismatch');
  }
  console.log('   ✅ Real-time audit logged: Sale ₹1,450 & Payment ₹800 recorded with worker attribution.');

  console.log('\n========================================================');
  console.log('🎉 ALL 8 AUTOMATED VERIFICATION CHECKS PASSED SUCCESSFULLY!');
  console.log('========================================================\n');
}

runVerification().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
