// Polyfill minimal browser environment for Node.js
const mockStorage = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (key: string) => mockStorage.get(key) || null,
  setItem: (key: string, val: any) => mockStorage.set(key, String(val)),
  removeItem: (key: string) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
  get length() {
    return mockStorage.size;
  },
  key: (i: number) => Array.from(mockStorage.keys())[i] || null,
} as any;

import { LocalSaleRepository } from '../src/features/sales/repositories/salesRepository';
import { LocalStorageDB } from '../src/services/localStorageDB';

async function testCustomItemizedSale() {
  console.log('Testing custom itemized sale creation...');
  const shopId = 'test_shop_' + Date.now();
  
  // 1. Create a customer
  const customer = await LocalStorageDB.insert('customers', {
    shop_id: shopId,
    name: 'Jaswanth Majji',
    phone: '08121157489',
    current_balance: 0,
  });

  const saleRepo = new LocalSaleRepository();

  // 2. Create sale with custom item (e.g. 'T-shirt' with productId: '1' or custom name)
  try {
    const sale = await saleRepo.createSale(shopId, {
      customerId: customer.id,
      subtotal: 500,
      discountAmount: 100,
      taxAmount: 0,
      totalAmount: 400,
      amountPaid: 0,
      paymentStatus: 'unpaid',
      paymentMethod: 'cash',
      items: [
        {
          productId: '1', // The row UI id that used to cause "Product 1 does not exist"
          name: 'T-shirt',
          quantity: 1,
          unitPrice: 500,
          totalPrice: 500,
        }
      ],
    });

    console.log('✅ Sale created successfully:', sale.invoiceNo, 'Total:', sale.totalAmount);
    console.log('Items:', sale.items);
    
    // Check customer balance
    const updatedCustomer: any = await LocalStorageDB.selectOne('customers', (c: any) => c.id === customer.id);
    console.log('Customer updated balance:', updatedCustomer.current_balance, '(Expected: 400)');

    if (updatedCustomer.current_balance === 400) {
      console.log('🎉 TEST PASSED: Custom itemized sale completed with zero errors!');
    } else {
      console.error('❌ Balance mismatch');
    }
  } catch (err: any) {
    console.error('❌ Test failed with error:', err.message);
  }
}

testCustomItemizedSale();
