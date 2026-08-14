/* features/customers/index.ts */
export * from './types';
export * from './repositories/customerRepository';
export * from './hooks/useCustomers';
export { default as CustomerListPage } from './pages/CustomerListPage';
export { AddCustomerModal } from './components/AddCustomerModal';
export { EditCustomerModal } from './components/EditCustomerModal';
export { CustomerDetailsModal } from './components/CustomerDetailsModal';
