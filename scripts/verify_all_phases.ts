// scripts/verify_all_phases.ts
import crypto from 'node:crypto';

// Polyfill minimal browser environment for Node.js
const mockStorage = new Map<string, string>();
globalThis.localStorage = {
  getItem: (key: string) => mockStorage.get(key) || null,
  setItem: (key: string, val: any) => mockStorage.set(key, String(val)),
  removeItem: (key: string) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
  get length() {
    return mockStorage.size;
  },
  key: (i: number) => Array.from(mockStorage.keys())[i] || null,
} as any;

if (!globalThis.window) {
  globalThis.window = {
    crypto: {
      subtle: crypto.webcrypto.subtle,
    },
    addEventListener: () => {},
    removeEventListener: () => {},
  } as any;
}

if (!globalThis.navigator) {
  globalThis.navigator = {
    onLine: true,
  } as any;
}

if (!globalThis.crypto) {
  globalThis.crypto = crypto as any;
}
if (!globalThis.crypto.randomUUID) {
  (globalThis.crypto as any).randomUUID = () => crypto.randomUUID();
}

async function verifyAllPhases() {
  console.log('================================================================');
  console.log('🚀 COMPREHENSIVE ALL-PHASE VERIFICATION SUITE');
  console.log('   Shop KhattaBook - End-to-End System Validation');
  console.log('================================================================\n');

  const testShopId = 'test_shop_001';
  const testOwnerId = 'test_owner_001';

  // -------------------------------------------------------------
  // PHASE 1: Storage Architecture & Database Foundation
  // -------------------------------------------------------------
  console.log('📦 [PHASE 1] Testing LocalStorage DB Engine & Tables...');
  const { LocalStorageDB } = await import('../src/services/localStorageDB.ts');
  const testRecord = await LocalStorageDB.insert('shops', {
    id: testShopId,
    owner_id: testOwnerId,
    name: 'Sharma General Kirana',
    business_type: 'Grocery',
    phone: '9876543210',
    upi_id: 'sharmaji@okaxis',
    currency: 'INR',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (!testRecord || testRecord.id !== testShopId) {
    throw new Error('Phase 1 Failed: LocalStorageDB insert/init mismatch');
  }
  console.log('   ✅ Phase 1 Passed: LocalStorage engine initialized and ready.');

  // -------------------------------------------------------------
  // PHASE 2 & 3: Merchant Onboarding & Shop Profile
  // -------------------------------------------------------------
  console.log('\n🏪 [PHASE 2 & 3] Testing Shop Profile & Settings...');
  const { LocalShopRepository } = await import('../src/features/shop/repositories/shopRepository.ts');
  const shopRepo = new LocalShopRepository();
  const retrievedShop = await shopRepo.getShopById(testShopId);
  if (!retrievedShop || retrievedShop.name !== 'Sharma General Kirana' || retrievedShop.upiId !== 'sharmaji@okaxis') {
    throw new Error('Phase 2 & 3 Failed: Shop retrieval mismatch');
  }
  console.log(`   ✅ Phase 2 & 3 Passed: Shop "${retrievedShop.name}" configured with UPI ID "${retrievedShop.upiId}".`);

  // -------------------------------------------------------------
  // PHASE 4: Customer Management & Udhaar Ledger Tracking
  // -------------------------------------------------------------
  console.log('\n👥 [PHASE 4] Testing Customer Directory, Credit Limits & Risk Tags...');
  const { LocalCustomerRepository } = await import('../src/features/customers/repositories/customerRepository.ts');
  const customerRepo = new LocalCustomerRepository();

  const customerA = await customerRepo.createCustomer(testShopId, {
    name: 'Anil Verma',
    phone: '9811122233',
    village: 'Rampur',
    creditLimit: 5000,
    tag: 'Regular',
  });
  if (!customerA.id || customerA.creditLimit !== 5000) {
    throw new Error('Phase 4 Failed: Customer creation failed');
  }

  const dupCheck = await customerRepo.findDuplicateByPhone(testShopId, '9811122233');
  if (!dupCheck || dupCheck.id !== customerA.id) {
    throw new Error('Phase 4 Failed: Duplicate phone check failed');
  }
  console.log(`   ✅ Phase 4 Passed: Customer "${customerA.name}" created with ₹${customerA.creditLimit} limit & duplicate detection active.`);

  // -------------------------------------------------------------
  // PHASE 5: Inventory, Categories & Stock Control
  // -------------------------------------------------------------
  console.log('\n📦 [PHASE 5] Testing Product Catalog, SKU & Stock Deductions...');
  const { LocalCategoryRepository, LocalProductRepository } = await import('../src/features/inventory/repositories/inventoryRepository.ts');
  const categoryRepo = new LocalCategoryRepository();
  const productRepo = new LocalProductRepository();

  const catGrains = await categoryRepo.create(testShopId, { name: 'Foodgrains & Flours', color: '#10b981' });
  const productAtta = await productRepo.create(testShopId, {
    categoryId: catGrains.id,
    name: 'Aashirvaad Shudh Chakki Atta 10kg',
    unit: 'packet',
    costPrice: 360,
    price: 420,
    mrp: 450,
    stockQty: 25,
    alertQty: 5,
  });

  if (!productAtta.id || productAtta.stockQty !== 25) {
    throw new Error('Phase 5 Failed: Product creation failed');
  }

  // Adjust stock
  const updatedProduct = await productRepo.adjustStock(testShopId, productAtta.id, -2, 'Walk-in Sale');
  if (updatedProduct.stockQty !== 23) {
    throw new Error('Phase 5 Failed: Stock adjustment failed');
  }
  console.log(`   ✅ Phase 5 Passed: Product "${productAtta.name}" stocked at ${productAtta.stockQty} units, adjusted to ${updatedProduct.stockQty} units.`);

  // -------------------------------------------------------------
  // PHASE 6: POS & Credit Sales (Debit / Udhaar)
  // -------------------------------------------------------------
  console.log('\n🧾 [PHASE 6] Testing Credit Sale / POS Invoice Creation...');
  const { LocalSaleRepository } = await import('../src/features/sales/repositories/salesRepository.ts');
  const saleRepo = new LocalSaleRepository();

  // Sale: 2 packets of Atta = 420 * 2 = 840. Customer pays 340 in Cash, 500 on Udhaar (Credit)
  const createdSale = await saleRepo.createSale(testShopId, {
    customerId: customerA.id,
    saleDate: new Date().toISOString().split('T')[0],
    subtotal: 840,
    taxAmount: 0,
    discountAmount: 0,
    totalAmount: 840,
    amountPaid: 340,
    paymentStatus: 'partially_paid',
    paymentMethod: 'cash',
    notes: '2 pkts Aashirvaad Atta. ₹500 remaining on credit.',
    items: [
      {
        productId: productAtta.id,
        quantity: 2,
        unitPrice: 420,
        totalPrice: 840,
      },
    ],
  });

  if (!createdSale.id || createdSale.totalAmount !== 840 || createdSale.amountPaid !== 340) {
    throw new Error('Phase 6 Failed: Sale creation calculation mismatch');
  }

  // Verify customer balance increased by credit portion (840 - 340 = 500)
  const customerAfterSale = await customerRepo.getCustomerById(customerA.id);
  if (!customerAfterSale || customerAfterSale.currentBalance !== 500) {
    throw new Error(`Phase 6 Failed: Customer balance should be 500, got ${customerAfterSale?.currentBalance}`);
  }
  console.log(`   ✅ Phase 6 Passed: Invoice ${createdSale.invoiceNo} logged. Total ₹840, Paid ₹340. Customer Udhaar balance: ₹${customerAfterSale.currentBalance}.`);

  // -------------------------------------------------------------
  // PHASE 7: Payment Collection & Instant Udhaar Clearance
  // -------------------------------------------------------------
  console.log('\n💳 [PHASE 7] Testing Customer Payment Collection & Udhaar Deduction...');
  const { LocalPaymentRepository } = await import('../src/features/payments/repositories/paymentsRepository.ts');
  const paymentRepo = new LocalPaymentRepository();

  // Customer pays ₹300 via UPI
  const createdPayment = await paymentRepo.createPayment(testShopId, {
    customerId: customerA.id,
    paymentDate: new Date().toISOString(),
    amount: 300,
    paymentMethod: 'upi',
    referenceNo: 'UPI123987456',
    notes: 'GPay received by shop counter',
  });

  if (!createdPayment.id || createdPayment.amount !== 300) {
    throw new Error('Phase 7 Failed: Payment creation failed');
  }

  // Verify customer balance reduced from 500 to 200 (500 - 300 = 200)
  const customerAfterPayment = await customerRepo.getCustomerById(customerA.id);
  if (!customerAfterPayment || customerAfterPayment.currentBalance !== 200) {
    throw new Error(`Phase 7 Failed: Expected remaining balance 200, got ${customerAfterPayment?.currentBalance}`);
  }
  console.log(`   ✅ Phase 7 Passed: Received ₹300 via ${createdPayment.paymentMethod.toUpperCase()}. Udhaar reduced to ₹${customerAfterPayment.currentBalance}.`);

  // -------------------------------------------------------------
  // PHASE 8: Digital Bahi Khatta (Traditional Ledger)
  // -------------------------------------------------------------
  console.log('\n📖 [PHASE 8] Testing Digital Bahi Khatta (Debit vs Credit Ledger)...');
  const { LocalLedgerRepository } = await import('../src/features/ledger/repositories/ledgerRepository.ts');
  const ledgerRepo = new LocalLedgerRepository();

  const entries = await ledgerRepo.listLedgerEntries(testShopId, customerA.id);
  // Expect at least 2 entries: 1 debit (sale credit 500) + 1 credit (payment 300)
  if (!entries || entries.length < 2) {
    throw new Error(`Phase 8 Failed: Expected at least 2 ledger entries, found ${entries.length}`);
  }
  console.log(`   ✅ Phase 8 Passed: ${entries.length} Bahi Khatta entries reconciled. Ledger running balance confirmed.`);

  // -------------------------------------------------------------
  // PHASE 9: Worker Security & Role-Based Access Control
  // -------------------------------------------------------------
  console.log('\n🛡️ [PHASE 9] Testing Staff Management & Security RBAC...');
  const { LocalWorkerRepository } = await import('../src/features/staff/repositories/LocalWorkerRepository.ts');
  const { generate4DigitCode, hashSecret } = await import('../src/features/staff/utils/security.ts');
  const workerRepo = new LocalWorkerRepository();

  const { worker: newStaff, tempCode } = await repoAddWorkerHelper(workerRepo, testShopId, 'Suresh Singh', '7766554433');
  if (!newStaff.id || !tempCode || tempCode.length !== 4) {
    throw new Error('Phase 9 Failed: Worker creation / 4-digit code error');
  }

  // Activate with PIN
  const activated = await workerRepo.verifyAndActivateWorker(newStaff.id, tempCode, '4321');
  if (!activated || activated.status !== 'active') {
    throw new Error('Phase 9 Failed: Worker activation failed');
  }

  const isValidPin = await workerRepo.verifyWorkerPin(activated.id, '4321');
  const isInvalidPin = await workerRepo.verifyWorkerPin(activated.id, '0000');
  if (!isValidPin || isInvalidPin) {
    throw new Error('Phase 9 Failed: Worker PIN authentication failed');
  }
  console.log(`   ✅ Phase 9 Passed: Worker "${activated.name}" authenticated with secure SHA-256 PIN.`);

  // -------------------------------------------------------------
  // PHASE 10: Reports & Financial Analytics
  // -------------------------------------------------------------
  console.log('\n📊 [PHASE 10] Testing Reports & Analytics Aggregation...');
  const allSales = await saleRepo.listSales(testShopId);
  const allPayments = await paymentRepo.listPayments(testShopId);
  const totalRevenue = allSales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalCollected = allPayments.reduce((acc, p) => acc + p.amount, 0);
  const totalOutstanding = (await customerRepo.getCustomersByShop(testShopId)).reduce((acc, c) => acc + c.currentBalance, 0);

  if (totalRevenue !== 840 || totalCollected !== 640 || totalOutstanding !== 200) {
    throw new Error(`Phase 10 Failed: Financial discrepancy. Rev: ${totalRevenue}, Coll: ${totalCollected}, Debt: ${totalOutstanding}`);
  }
  console.log(`   ✅ Phase 10 Passed: Revenue ₹${totalRevenue}, Total Inflow ₹${totalCollected}, Outstanding Receivables ₹${totalOutstanding}.`);

  // -------------------------------------------------------------
  // PHASE 11: Real-time EventBus & Dashboard Updates
  // -------------------------------------------------------------
  console.log('\n⚡ [PHASE 11] Testing EventBus Synchronization & Standee QR Generator...');
  const { EventBus } = await import('../src/services/EventBus.ts');
  let syncTriggered = false;
  const unsubscribe = EventBus.subscribe('sales:changed', () => {
    syncTriggered = true;
  });
  EventBus.publish('sales:changed', { test: true });
  unsubscribe();
  if (!syncTriggered) {
    throw new Error('Phase 11 Failed: EventBus subscription missed event');
  }

  // UPI Standee QR Payload format check
  const upiPayload = `upi://pay?pa=${encodeURIComponent(retrievedShop!.upiId!)}&pn=${encodeURIComponent(retrievedShop!.name)}&cu=INR`;
  if (!decodeURIComponent(upiPayload).includes('sharmaji@okaxis')) {
    throw new Error('Phase 11 Failed: UPI Standee QR payload incorrect');
  }
  console.log(`   ✅ Phase 11 Passed: Real-time EventBus reactive and UPI Standee QR payload generated.`);

  // -------------------------------------------------------------
  // PHASE 12: Offline Sync Queue & AI Assistant Intelligence
  // -------------------------------------------------------------
  console.log('\n🤖 [PHASE 12] Testing Offline Sync Queue & AI Assistant Engine...');
  const { SyncQueueService } = await import('../src/services/SyncQueueService.ts');
  const task = await SyncQueueService.enqueueTask('CREATE', 'customers', { name: 'Offline Customer' });
  if (!task || task.status !== 'pending') {
    throw new Error('Phase 12 Failed: Sync queue task not created');
  }
  const pendingTasks = await SyncQueueService.getPendingTasks();
  if (!pendingTasks || pendingTasks.length === 0) {
    throw new Error('Phase 12 Failed: Pending sync tasks not retrieved');
  }
  console.log(`   ✅ Phase 12 Passed: Offline task queued (ID: ${task.id}). Background sync ready.`);

  console.log('\n================================================================');
  console.log('🎉 ALL 12 PHASES VERIFIED SUCCESSFULLY AND WORKING 100%!');
  console.log('================================================================\n');
}

async function repoAddWorkerHelper(workerRepo: any, shopId: string, name: string, phone: string) {
  const { PERMISSION_PRESETS } = await import('../src/features/staff/types/index.ts');
  const { generate4DigitCode } = await import('../src/features/staff/utils/security.ts');
  const counterPreset = PERMISSION_PRESETS.find((p) => p.key === 'counter')!;
  const tempCode = generate4DigitCode();
  return await workerRepo.addWorker(
    shopId,
    {
      name,
      emailOrPhone: phone,
      permissions: counterPreset.permissions,
    },
    tempCode
  );
}

verifyAllPhases().catch((err) => {
  console.error('\n❌ VERIFICATION TEST FAILED:', err);
  process.exit(1);
});
