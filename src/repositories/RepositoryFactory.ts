/* repositories/RepositoryFactory.ts */
import { isSupabaseConfigured } from '../config/supabase';
import { 
  type IAuthRepository, 
  SupabaseAuthRepository, 
  LocalAuthRepository 
} from '../features/auth/repositories/authRepository';
import { 
  type IShopRepository, 
  SupabaseShopRepository, 
  LocalShopRepository 
} from '../features/shop/repositories/shopRepository';
import { 
  type ICustomerRepository, 
  SupabaseCustomerRepository, 
  LocalCustomerRepository 
} from '../features/customers/repositories/customerRepository';
import { 
  type ICategoryRepository, 
  type IProductRepository, 
  SupabaseCategoryRepository, 
  LocalCategoryRepository, 
  SupabaseProductRepository, 
  LocalProductRepository 
} from '../features/inventory/repositories/inventoryRepository';
import { 
  type ISaleRepository, 
  SupabaseSaleRepository, 
  LocalSaleRepository 
} from '../features/sales/repositories/salesRepository';
import { 
  type IPaymentRepository, 
  SupabasePaymentRepository, 
  LocalPaymentRepository 
} from '../features/payments/repositories/paymentsRepository';
import { 
  type ILedgerRepository, 
  SupabaseLedgerRepository, 
  LocalLedgerRepository 
} from '../features/ledger/repositories/ledgerRepository';

class RepositoryFactoryService {
  private useSupabase = isSupabaseConfigured();

  getAuthRepository(): IAuthRepository {
    return this.useSupabase ? new SupabaseAuthRepository() : new LocalAuthRepository();
  }

  getShopRepository(): IShopRepository {
    return this.useSupabase ? new SupabaseShopRepository() : new LocalShopRepository();
  }

  getCustomerRepository(): ICustomerRepository {
    return this.useSupabase ? new SupabaseCustomerRepository() : new LocalCustomerRepository();
  }

  getCategoryRepository(): ICategoryRepository {
    return this.useSupabase ? new SupabaseCategoryRepository() : new LocalCategoryRepository();
  }

  getProductRepository(): IProductRepository {
    return this.useSupabase ? new SupabaseProductRepository() : new LocalProductRepository();
  }

  getSaleRepository(): ISaleRepository {
    return this.useSupabase ? new SupabaseSaleRepository() : new LocalSaleRepository();
  }

  getPaymentRepository(): IPaymentRepository {
    return this.useSupabase ? new SupabasePaymentRepository() : new LocalPaymentRepository();
  }

  getLedgerRepository(): ILedgerRepository {
    return this.useSupabase ? new SupabaseLedgerRepository() : new LocalLedgerRepository();
  }
}

export const RepositoryFactory = new RepositoryFactoryService();
