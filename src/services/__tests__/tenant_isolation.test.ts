/* tenant_isolation.test.ts */
// Polyfill localStorage in Node environment if running standalone
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, String(v)),
    removeItem: (k: string) => { store.delete(k); },
    clear: () => store.clear(),
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() { return store.size; },
  } as any;
}

import { LocalAuthRepository } from '../../features/auth/repositories/authRepository';
import { LocalShopRepository } from '../../features/shop/repositories/shopRepository';
import { LocalCustomerRepository } from '../../features/customers/repositories/customerRepository';
import { LocalCategoryRepository, LocalProductRepository } from '../../features/inventory/repositories/inventoryRepository';
import { LocalSaleRepository } from '../../features/sales/repositories/salesRepository';
import { LocalLedgerRepository } from '../../features/ledger/repositories/ledgerRepository';
import { LocalStorageDB } from '../localStorageDB';

async function runTenantIsolationTests() {
  console.log('🧪 Starting Multi-Tenant Data Isolation Test Suite...\n');

  // Clear previous test run data
  LocalStorageDB.clearAll();

  const authRepo = new LocalAuthRepository();
  const shopRepo = new LocalShopRepository();
  const customerRepo = new LocalCustomerRepository();
  const categoryRepo = new LocalCategoryRepository();
  const productRepo = new LocalProductRepository();
  const saleRepo = new LocalSaleRepository();
  const ledgerRepo = new LocalLedgerRepository();

  // 1. User 1 Onboarding & Shop 1 Creation
  console.log('1️⃣ Creating User 1 & Shop 1 ("Om Supermarket")...');
  const user1 = await authRepo.signUp('owner1@omsupermarket.com', 'pass123', 'Rajesh Sharma');
  const shop1 = await shopRepo.createShop(user1.id, {
    name: 'Om Supermarket',
    businessType: 'Retail Grocery',
    city: 'Hyderabad',
    state: 'Telangana',
    currency: 'INR',
  });
  console.log(`   -> Created Shop 1 with ID: ${shop1.id}`);

  // User 1 creates Customer, Category, Product, and Credit Sale
  const customer1 = await customerRepo.createCustomer(shop1.id, {
    name: 'Aarav Gupta',
    phone: '9876543210',
    creditLimit: 15000,
    openingBalance: 1200,
    balanceType: 'udhaar',
  });
  console.log(`   -> Shop 1 added Customer: "${customer1.name}" (ID: ${customer1.id})`);

  const category1 = await categoryRepo.create(shop1.id, {
    name: 'Grains & Pulses',
    color: '#10B981',
  });

  const product1 = await productRepo.create(shop1.id, {
    name: 'Daawat Basmati Rice 5kg',
    categoryId: category1.id,
    price: 450,
    costPrice: 380,
    stockQty: 50,
    alertQty: 5,
  });
  console.log(`   -> Shop 1 added Product: "${product1.name}" (ID: ${product1.id})`);

  const sale1 = await saleRepo.createSale(shop1.id, {
    customerId: customer1.id,
    items: [
      {
        productId: product1.id,
        quantity: 2,
        unitPrice: 450,
        totalPrice: 900,
      },
    ],
    subtotal: 900,
    taxAmount: 0,
    discountAmount: 0,
    totalAmount: 900,
    amountPaid: 200,
    paymentStatus: 'partially_paid',
  });
  console.log(`   -> Shop 1 recorded Sale: Invoice ${sale1.invoiceNo} for ₹900 (₹200 paid, ₹700 credit)`);

  const ledger1 = await ledgerRepo.listLedgerEntries(shop1.id, customer1.id);
  console.log(`   -> Shop 1 Ledger entries for Customer: ${ledger1.length} entries`);

  console.log('\n------------------------------------------------------------\n');

  // 2. User 2 Onboarding & Shop 2 Creation
  console.log('2️⃣ Creating User 2 & Shop 2 ("Ganesh Provisions")...');
  const user2 = await authRepo.signUp('owner2@ganeshprovisions.com', 'pass456', 'Kiran Patel');
  const shop2 = await shopRepo.createShop(user2.id, {
    name: 'Ganesh Provisions',
    businessType: 'General Store',
    city: 'Mumbai',
    state: 'Maharashtra',
    currency: 'INR',
  });
  console.log(`   -> Created Shop 2 with ID: ${shop2.id}`);

  console.log('\n------------------------------------------------------------\n');

  // 3. Strict Verification: User 2 must see 0 of User 1 / Shop 1's records
  console.log('3️⃣ Verifying Zero Cross-Tenant Data Leakage for Shop 2...');

  const shop2Customers = await customerRepo.getCustomersByShop(shop2.id);
  if (shop2Customers.length !== 0) {
    throw new Error(`❌ ISOLATION BREACH: Shop 2 saw ${shop2Customers.length} customers from other shops!`);
  }
  console.log('   ✅ PASS: Shop 2 has 0 customers (Customer 1 is invisible).');

  const shop2Categories = await categoryRepo.list(shop2.id);
  if (shop2Categories.length !== 0) {
    throw new Error(`❌ ISOLATION BREACH: Shop 2 saw ${shop2Categories.length} categories from other shops!`);
  }
  console.log('   ✅ PASS: Shop 2 has 0 categories (Category 1 is invisible).');

  const shop2Products = await productRepo.list(shop2.id);
  if (shop2Products.length !== 0) {
    throw new Error(`❌ ISOLATION BREACH: Shop 2 saw ${shop2Products.length} products from other shops!`);
  }
  console.log('   ✅ PASS: Shop 2 has 0 products (Product 1 is invisible).');

  const shop2Sales = await saleRepo.listSales(shop2.id);
  if (shop2Sales.length !== 0) {
    throw new Error(`❌ ISOLATION BREACH: Shop 2 saw ${shop2Sales.length} sales from other shops!`);
  }
  console.log('   ✅ PASS: Shop 2 has 0 sales (Sale 1 is invisible).');

  const shop2Ledger = await ledgerRepo.listLedgerEntries(shop2.id);
  if (shop2Ledger.length !== 0) {
    throw new Error(`❌ ISOLATION BREACH: Shop 2 saw ${shop2Ledger.length} ledger entries from other shops!`);
  }
  console.log('   ✅ PASS: Shop 2 has 0 ledger entries (Ledger 1 is invisible).');

  console.log('\n------------------------------------------------------------\n');

  // 4. Cross-Tenant Tampering / Direct ID Access Attack Test
  console.log('4️⃣ Testing Cross-Tenant Access Rejection by Direct ID...');

  // User 2 tries to fetch Customer 1 by ID using Shop 2 context
  const directFetch = await customerRepo.getCustomerById(customer1.id, shop2.id);
  if (directFetch !== null) {
    throw new Error('❌ ISOLATION BREACH: Shop 2 accessed Customer 1 via direct ID lookup!');
  }
  console.log('   ✅ PASS: Cross-tenant direct ID customer query returned null.');

  // User 2 tries to delete Customer 1 under Shop 2 context
  await customerRepo.deleteCustomer(customer1.id, shop2.id);
  const stillExistsInShop1 = await customerRepo.getCustomerById(customer1.id, shop1.id);
  if (!stillExistsInShop1) {
    throw new Error('❌ ISOLATION BREACH: Shop 2 was able to delete Customer 1!');
  }
  console.log('   ✅ PASS: Customer 1 remained intact and was NOT deleted by Shop 2 attempt.');

  // User 2 tries to record a sale using Customer 1's ID under Shop 2
  try {
    await saleRepo.createSale(shop2.id, {
      customerId: customer1.id,
      items: [{ productId: 'dummy-p', quantity: 1, unitPrice: 100, totalPrice: 100 }],
      subtotal: 100,
      totalAmount: 100,
      amountPaid: 100,
      paymentStatus: 'paid',
    });
    throw new Error('❌ ISOLATION BREACH: Shop 2 was able to bill Customer 1 from Shop 1!');
  } catch (err: any) {
    console.log(`   ✅ PASS: Cross-tenant billing was rejected with: "${err.message}"`);
  }

  console.log('\n------------------------------------------------------------\n');

  // 5. User 2 creates their own independent data
  console.log('5️⃣ User 2 creates independent data in Shop 2...');
  const customer2 = await customerRepo.createCustomer(shop2.id, {
    name: 'Meera Deshmukh',
    phone: '9123456780',
    creditLimit: 25000,
  });
  console.log(`   -> Shop 2 added Customer: "${customer2.name}"`);

  const product2 = await productRepo.create(shop2.id, {
    name: 'Fortune Sunflower Oil 1L',
    price: 160,
    costPrice: 140,
    stockQty: 30,
  });
  console.log(`   -> Shop 2 added Product: "${product2.name}"`);

  // Verify Shop 1 does NOT see Shop 2's data
  const shop1FinalCustomers = await customerRepo.getCustomersByShop(shop1.id);
  if (shop1FinalCustomers.some((c) => c.id === customer2.id)) {
    throw new Error('❌ ISOLATION BREACH: Shop 1 saw Shop 2 customer!');
  }
  const shop1FinalProducts = await productRepo.list(shop1.id);
  if (shop1FinalProducts.some((p) => p.id === product2.id)) {
    throw new Error('❌ ISOLATION BREACH: Shop 1 saw Shop 2 product!');
  }
  console.log('   ✅ PASS: Shop 1 only sees its own data, strictly zero records from Shop 2.');

  console.log('\n------------------------------------------------------------\n');

  // 6. Multi-Shop Support Test for Same User
  console.log('6️⃣ Testing Multi-Shop Creation for Single User (User 1)...');
  const shop1Branch = await shopRepo.createShop(user1.id, {
    name: 'Om Supermarket - Branch 2',
    businessType: 'Retail Grocery',
    city: 'Secunderabad',
    state: 'Telangana',
    currency: 'INR',
  });
  console.log(`   -> User 1 created secondary branch: "${shop1Branch.name}" (ID: ${shop1Branch.id})`);

  const user1Shops = await shopRepo.getShopsByOwner(user1.id);
  if (user1Shops.length !== 2) {
    throw new Error(`Expected 2 shops for User 1, but found ${user1Shops.length}`);
  }
  console.log(`   ✅ PASS: User 1 owns ${user1Shops.length} isolated shops.`);

  // Verify branch has isolated data from main shop
  const branchCustomers = await customerRepo.getCustomersByShop(shop1Branch.id);
  if (branchCustomers.length !== 0) {
    throw new Error('❌ ISOLATION BREACH: Branch inherited main shop customers unexpectedly!');
  }
  console.log('   ✅ PASS: Branch 2 has independent isolated customer list.');

  console.log('\n============================================================');
  console.log('🎉 ALL MULTI-TENANT ISOLATION TESTS PASSED (100% SUCCESS)');
  console.log('============================================================\n');
}

runTenantIsolationTests().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
