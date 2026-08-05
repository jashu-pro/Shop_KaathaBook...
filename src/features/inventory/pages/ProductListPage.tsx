/* features/inventory/pages/ProductListPage.tsx */
import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Barcode, 
  AlertTriangle, 
  FolderPlus, 
  PackagePlus,
  Trash2
} from 'lucide-react';
import { useInventory } from '../hooks/useInventory';
import { AddProductModal } from '../components/AddProductModal';
import { AddCategoryModal } from '../components/AddCategoryModal';
import { RestockModal } from '../components/RestockModal';
import type { InventoryFilterTab, Product } from '../types';

const ProductListPage: React.FC = () => {
  const { products, categories, isLoading, refetch, removeProduct } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<InventoryFilterTab>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);

  // Compute Metrics
  const totalProducts = products.length;

  const totalStockValue = useMemo(() => {
    return products.reduce((acc, p) => acc + p.price * p.stockQty, 0);
  }, [products]);

  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.stockQty > 0 && p.stockQty <= p.alertQty).length;
  }, [products]);

  const outOfStockCount = useMemo(() => {
    return products.filter((p) => p.stockQty === 0).length;
  }, [products]);

  // Filter Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.includes(q)) ||
        (p.categoryName && p.categoryName.toLowerCase().includes(q));

      let matchesTab = true;
      if (activeTab === 'low_stock') matchesTab = p.stockQty > 0 && p.stockQty <= p.alertQty;
      else if (activeTab === 'out_of_stock') matchesTab = p.stockQty === 0;

      let matchesCat = true;
      if (selectedCategory !== 'all') {
        matchesCat = p.categoryId === selectedCategory;
      }

      return matchesSearch && matchesTab && matchesCat;
    });
  }, [products, searchQuery, activeTab, selectedCategory]);

  const handleDeleteProduct = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      await removeProduct(id);
      refetch();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'modal-slide 0.3s ease' }}>
      
      {/* ------------------------------------------------------------- */}
      {/* TOP INVENTORY HEADER & KPI SUMMARY BAR                        */}
      {/* ------------------------------------------------------------- */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: '20px',
        padding: '1.25rem 1.5rem',
        border: '1px solid var(--border-color)',
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.03)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <Package size={22} style={{ color: 'var(--primary)' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-heading)' }}>
              Inventory & POS Stock
            </h2>
            <span className="badge badge-success" style={{ marginLeft: '0.25rem', fontSize: '0.7rem' }}>
              {totalProducts} Items
            </span>
          </div>
          <p style={{ color: 'var(--text-body)', fontSize: '0.825rem' }}>
            Manage Kirana items, barcode scanning, stock alerts, and wholesale pricing.
          </p>
        </div>

        {/* Action Buttons & Stock Valuation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Stock Inventory Value
            </span>
            <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#10B981', lineHeight: 1.1 }}>
              ₹{totalStockValue.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {lowStockCount + outOfStockCount} items need attention
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button
              onClick={() => setIsAddCategoryOpen(true)}
              className="btn btn-secondary"
              style={{ borderRadius: '14px', padding: '0.65rem 1rem', fontWeight: '700', fontSize: '0.825rem' }}
            >
              <FolderPlus size={16} />
              <span>+ Category</span>
            </button>

            <button
              onClick={() => setIsAddProductOpen(true)}
              className="btn btn-primary"
              style={{ borderRadius: '14px', padding: '0.65rem 1.25rem', fontWeight: '700', fontSize: '0.85rem' }}
            >
              <Plus size={18} />
              <span>Add Product</span>
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* LOW STOCK ALERT BANNER (If items reach alertQty)              */}
      {/* ------------------------------------------------------------- */}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div style={{
          backgroundColor: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '16px',
          padding: '0.85rem 1.15rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <AlertTriangle size={20} style={{ color: '#F59E0B' }} />
            <div>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: '#B45309' }}>
                Stock Replenishment Required!
              </h4>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-body)', marginTop: '0.1rem' }}>
                {outOfStockCount > 0 && <strong style={{ color: '#EF4444' }}>{outOfStockCount} Out of Stock</strong>}
                {outOfStockCount > 0 && lowStockCount > 0 && ' | '}
                {lowStockCount > 0 && <strong style={{ color: '#F59E0B' }}>{lowStockCount} Low Stock Alert</strong>}
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('low_stock')}
            className="btn btn-secondary"
            style={{ borderRadius: '12px', fontSize: '0.775rem', padding: '0.4rem 0.85rem', color: '#B45309', borderColor: 'rgba(245, 158, 11, 0.3)' }}
          >
            View Low Stock Items
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SEARCH, FILTER TABS & CATEGORY CHIPS                          */}
      {/* ------------------------------------------------------------- */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: '20px',
        padding: '1rem 1.25rem',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem'
      }}>
        <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Bar */}
          <div style={{ flex: 1, minWidth: '240px', position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Search product name, SKU, or scan barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.5rem', padding: '0.65rem 1rem 0.65rem 2.5rem', fontSize: '0.85rem', borderRadius: '14px' }}
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
          {[
            { id: 'all', label: `All Products (${totalProducts})` },
            { id: 'low_stock', label: `Low Stock (${lowStockCount})` },
            { id: 'out_of_stock', label: `Out of Stock (${outOfStockCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as InventoryFilterTab)}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '12px',
                fontSize: '0.8rem',
                fontWeight: activeTab === tab.id ? '700' : '500',
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-body)',
                backgroundColor: activeTab === tab.id ? 'var(--primary-light)' : 'transparent',
                border: activeTab === tab.id ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Category Filter Chips */}
        {categories.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflowX: 'auto' }}>
            <span style={{ fontSize: '0.725rem', fontWeight: '700', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              Category Filter:
            </span>
            <button
              onClick={() => setSelectedCategory('all')}
              style={{
                padding: '0.25rem 0.65rem', borderRadius: '10px', fontSize: '0.725rem', fontWeight: '600',
                backgroundColor: selectedCategory === 'all' ? 'var(--primary)' : 'var(--bg-secondary)',
                color: selectedCategory === 'all' ? '#FFFFFF' : 'var(--text-body)', cursor: 'pointer', border: 'none'
              }}
            >
              All Categories
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                style={{
                  padding: '0.25rem 0.65rem', borderRadius: '10px', fontSize: '0.725rem', fontWeight: '600',
                  backgroundColor: selectedCategory === c.id ? 'var(--primary)' : 'var(--bg-secondary)',
                  color: selectedCategory === c.id ? '#FFFFFF' : 'var(--text-body)', cursor: 'pointer', border: 'none',
                  whiteSpace: 'nowrap'
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* PRODUCTS LIST GRID / CARDS                                    */}
      {/* ------------------------------------------------------------- */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-sm">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton" style={{ height: '160px', borderRadius: '18px' }} />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div style={{
          backgroundColor: 'var(--bg-card)', borderRadius: '20px', padding: '3rem 1.5rem',
          textAlign: 'center', border: '1px solid var(--border-color)'
        }}>
          <Package size={40} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-heading)' }}>
            No Products Found
          </h3>
          <p style={{ color: 'var(--text-body)', fontSize: '0.85rem', marginTop: '0.2rem', marginBottom: '1.25rem' }}>
            {searchQuery ? `No item matching "${searchQuery}"` : 'Get started by adding items to your stock catalog'}
          </p>
          <button onClick={() => setIsAddProductOpen(true)} className="btn btn-primary" style={{ borderRadius: '14px', fontSize: '0.85rem' }}>
            <Plus size={16} /> Add Product Now
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.85rem' }}>
          {filteredProducts.map((product) => {
            const isOutOfStock = product.stockQty === 0;
            const isLowStock = product.stockQty > 0 && product.stockQty <= product.alertQty;

            return (
              <div
                key={product.id}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '18px',
                  padding: '1.15rem 1.25rem',
                  border: isOutOfStock
                    ? '1px solid rgba(239, 68, 68, 0.4)'
                    : isLowStock
                    ? '1px solid rgba(245, 158, 11, 0.4)'
                    : '1px solid var(--border-color)',
                  boxShadow: '0 2px 12px rgba(15, 23, 42, 0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.85rem'
                }}
              >
                {/* Header Row: Product Image, Name & Stock Status Badge */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.6rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {/* Thumbnail */}
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '12px',
                      backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                      overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Package size={22} style={{ color: 'var(--text-muted)' }} />
                      )}
                    </div>

                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-heading)', lineHeight: 1.2 }}>
                        {product.name}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                        {product.sku && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                            {product.sku}
                          </span>
                        )}
                        {product.barcode && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                            <Barcode size={10} /> {product.barcode}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stock Status Badge */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{
                      backgroundColor: isOutOfStock
                        ? 'rgba(239, 68, 68, 0.1)'
                        : isLowStock
                        ? 'rgba(245, 158, 11, 0.1)'
                        : 'rgba(16, 185, 129, 0.1)',
                      color: isOutOfStock ? '#EF4444' : isLowStock ? '#F59E0B' : '#10B981',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '12px',
                      fontSize: '0.775rem',
                      fontWeight: '800'
                    }}>
                      {isOutOfStock ? '0 Out of Stock' : `${product.stockQty} ${product.unit}s`}
                    </div>
                  </div>
                </div>

                {/* Pricing Info Row */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.55rem 0.85rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '14px'
                }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                      Selling Price
                    </span>
                    <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-heading)' }}>
                      ₹{product.price} <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-muted)' }}>/ {product.unit}</span>
                    </div>
                  </div>

                  {product.mrp > product.price && (
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                        MRP ₹{product.mrp}
                      </span>
                      <div style={{ fontSize: '0.725rem', fontWeight: '700', color: '#10B981' }}>
                        Save ₹{product.mrp - product.price}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Actions: Restock (+ Stock) & Delete */}
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    onClick={() => setRestockProduct(product)}
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '0.5rem 0.6rem', fontSize: '0.775rem', borderRadius: '12px', backgroundColor: '#059669' }}
                  >
                    <PackagePlus size={13} /> + Restock
                  </button>

                  <button
                    onClick={() => handleDeleteProduct(product.id, product.name)}
                    className="btn btn-secondary btn-icon"
                    style={{ width: '32px', height: '32px', borderRadius: '10px', color: '#EF4444' }}
                    title="Delete Product"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onSuccess={() => refetch()}
        onOpenAddCategory={() => {
          setIsAddProductOpen(false);
          setIsAddCategoryOpen(true);
        }}
      />

      {/* Add Category Modal */}
      <AddCategoryModal
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        onSuccess={() => refetch()}
      />

      {/* Restock Modal */}
      <RestockModal
        product={restockProduct}
        isOpen={Boolean(restockProduct)}
        onClose={() => setRestockProduct(null)}
        onSuccess={() => refetch()}
      />

    </div>
  );
};

export default ProductListPage;
