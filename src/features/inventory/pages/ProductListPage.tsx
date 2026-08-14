/* features/inventory/pages/ProductListPage.tsx */
import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  FolderPlus, 
  ArrowUpDown,
  Filter,
  RotateCw,
  AlertCircle
} from 'lucide-react';
import { useInventory } from '../hooks/useInventory';
import { AddProductModal } from '../components/AddProductModal';
import { AddCategoryModal } from '../components/AddCategoryModal';
import { RestockModal } from '../components/RestockModal';
import { ProductCard } from '../components/ProductCard';
import type { InventoryFilterTab, Product } from '../types';

export const ProductListPage: React.FC = () => {
  const { products, categories, isLoading, error, refetch, removeProduct } = useInventory();

  // Search, Filter & Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<InventoryFilterTab>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortOption, setSortOption] = useState<'low_stock_first' | 'name_asc' | 'highest_margin'>('low_stock_first');

  // Modal Control States
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);

  // Compute Inventory Dashboard Statistics
  const totalProducts = products.length;

  const totalStockValuation = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.price * p.stockQty), 0);
  }, [products]);

  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.stockQty > 0 && p.stockQty <= p.alertQty).length;
  }, [products]);

  const outOfStockCount = useMemo(() => {
    return products.filter((p) => p.stockQty <= 0).length;
  }, [products]);

  // Multi-field Search, Filter, and Sort Processing
  const processedProducts = useMemo(() => {
    let result = products.filter((p) => {
      // Search matching across Name, SKU, Barcode, Category
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.includes(q)) ||
        (p.categoryName && p.categoryName.toLowerCase().includes(q));

      // Stock status filter matching
      let matchesTab = true;
      if (activeTab === 'low_stock') matchesTab = p.stockQty > 0 && p.stockQty <= p.alertQty;
      else if (activeTab === 'out_of_stock') matchesTab = p.stockQty <= 0;

      // Category filter matching
      let matchesCat = true;
      if (selectedCategory !== 'all') {
        matchesCat = p.categoryId === selectedCategory;
      }

      return matchesSearch && matchesTab && matchesCat;
    });

    // Sort processing
    return result.sort((a, b) => {
      if (sortOption === 'low_stock_first') {
        return a.stockQty - b.stockQty;
      }
      if (sortOption === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortOption === 'highest_margin') {
        const marginA = a.price > 0 ? ((a.price - (a.costPrice || 0)) / a.price) : 0;
        const marginB = b.price > 0 ? ((b.price - (b.costPrice || 0)) / b.price) : 0;
        return marginB - marginA;
      }
      return 0;
    });
  }, [products, searchQuery, activeTab, selectedCategory, sortOption]);

  const handleDeleteProduct = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      await removeProduct(id);
      refetch();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'modal-slide 0.3s ease' }}>
      
      {/* ------------------------------------------------------------- */}
      {/* TOP HEADER & INVENTORY KPI DASHBOARD BAR                      */}
      {/* ------------------------------------------------------------- */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h1 style={{ fontSize: '1.45rem', fontWeight: '800', color: 'var(--text-heading)', letterSpacing: '-0.5px' }}>
              Inventory & POS Stock
            </h1>
            <span className="badge badge-success" style={{ fontSize: '0.75rem', fontWeight: '800' }}>
              {totalProducts} Items
            </span>
          </div>
          <p style={{ color: 'var(--text-body)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Total Asset Valuation: <strong style={{ color: 'var(--primary)' }}>₹{totalStockValuation.toLocaleString('en-IN')}</strong>
          </p>
        </div>

        {/* Action Buttons: Add Category & Add Product */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsAddCategoryOpen(true)}
            className="btn btn-secondary"
            style={{ padding: '0.75rem 1.15rem', borderRadius: '18px', fontWeight: '700', gap: '0.4rem' }}
          >
            <FolderPlus size={18} />
            <span>+ Category</span>
          </button>

          <button
            onClick={() => {
              setEditingProduct(null);
              setIsAddProductOpen(true);
            }}
            className="btn btn-primary"
            style={{ padding: '0.75rem 1.35rem', borderRadius: '18px', fontWeight: '800', gap: '0.4rem' }}
          >
            <Plus size={18} />
            <span>+ Add Product</span>
          </button>
        </div>
      </div>

      {/* INVENTORY STATS SUMMARY ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{ padding: '1rem 1.25rem', borderRadius: '20px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Catalog Products</span>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-heading)', marginTop: '0.2rem' }}>{totalProducts} Items</div>
        </div>

        <div style={{ padding: '1rem 1.25rem', borderRadius: '20px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Stock Valuation</span>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--primary)', marginTop: '0.2rem' }}>₹{totalStockValuation.toLocaleString('en-IN')}</div>
        </div>

        <div style={{ padding: '1rem 1.25rem', borderRadius: '20px', backgroundColor: lowStockCount > 0 ? '#FFFBEB' : 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: lowStockCount > 0 ? '#D97706' : 'var(--text-muted)', textTransform: 'uppercase' }}>Low Stock Alert Items</span>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: lowStockCount > 0 ? '#D97706' : 'var(--text-heading)', marginTop: '0.2rem' }}>{lowStockCount} Items</div>
        </div>

        <div style={{ padding: '1rem 1.25rem', borderRadius: '20px', backgroundColor: outOfStockCount > 0 ? 'var(--error-light)' : 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: outOfStockCount > 0 ? 'var(--error)' : 'var(--text-muted)', textTransform: 'uppercase' }}>Out of Stock Items</span>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: outOfStockCount > 0 ? 'var(--error)' : 'var(--text-heading)', marginTop: '0.2rem' }}>{outOfStockCount} Items</div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SEARCH, FILTER PILLS & SORT SELECTOR BAR                      */}
      {/* ------------------------------------------------------------- */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        padding: '1rem 1.25rem',
        borderRadius: 'var(--radius-card, 24px)',
        border: '1px solid var(--border-color)',
        boxShadow: '0 2px 10px rgba(15, 23, 42, 0.02)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {/* Search Bar & Sort Dropdown */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Multi-field Search Input */}
          <div style={{ flex: 1, minWidth: '260px', position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Search by product name, SKU, barcode, category..."
              style={{ paddingLeft: '2.75rem' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Dropdown Filter */}
          <div style={{ minWidth: '180px' }}>
            <select
              className="input-field"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ fontWeight: '700', fontSize: '0.85rem' }}
            >
              <option value="all">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Sort Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '200px' }}>
            <ArrowUpDown size={16} style={{ color: 'var(--text-muted)' }} />
            <select
              className="input-field"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              style={{ fontWeight: '700', fontSize: '0.85rem' }}
            >
              <option value="low_stock_first">Sort: Low Stock First</option>
              <option value="name_asc">Sort: Name (A → Z)</option>
              <option value="highest_margin">Sort: Highest Margin %</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
          <Filter size={15} style={{ color: 'var(--text-muted)', flexShrink: 0, marginRight: '0.2rem' }} />

          {[
            { id: 'all', label: 'All Catalog Products' },
            { id: 'low_stock', label: `⚠️ Low Stock (${lowStockCount})` },
            { id: 'out_of_stock', label: `🔴 Out of Stock (${outOfStockCount})` },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: '0.45rem 0.95rem',
                  borderRadius: '16px',
                  border: isActive ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                  backgroundColor: isActive ? 'var(--primary-light)' : 'var(--bg-card)',
                  color: isActive ? 'var(--primary)' : 'var(--text-body)',
                  fontSize: '0.8rem',
                  fontWeight: isActive ? '800' : '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 150ms'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* PRODUCT CARDS GRID / SKELETON / EMPTY / ERROR                  */}
      {/* ------------------------------------------------------------- */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton" style={{ height: '240px', borderRadius: '24px' }} />
          ))}
        </div>
      ) : error ? (
        /* Error State */
        <div style={{
          padding: '3rem 2rem', textAlign: 'center',
          backgroundColor: 'var(--bg-card)', borderRadius: '24px',
          border: '1px solid var(--border-color)'
        }}>
          <AlertCircle size={48} style={{ color: 'var(--error)', margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-heading)' }}>Unable to Load Inventory</h3>
          <p style={{ color: 'var(--text-body)', fontSize: '0.875rem', marginTop: '0.25rem', marginBottom: '1.25rem' }}>
            Something went wrong while fetching inventory stock.
          </p>
          <button onClick={() => refetch()} className="btn btn-secondary" style={{ gap: '0.4rem', margin: '0 auto' }}>
            <RotateCw size={16} /> Retry
          </button>
        </div>
      ) : processedProducts.length === 0 ? (
        /* Empty State */
        <div style={{
          padding: '3.5rem 2rem', textAlign: 'center',
          backgroundColor: 'var(--bg-card)', borderRadius: '24px',
          border: '1px solid var(--border-color)'
        }}>
          <Package size={56} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-heading)' }}>
            {searchQuery || activeTab !== 'all' || selectedCategory !== 'all' ? 'No Products Match Criteria' : 'No Products Yet'}
          </h3>
          <p style={{ color: 'var(--text-body)', fontSize: '0.875rem', marginTop: '0.35rem', marginBottom: '1.5rem' }}>
            {searchQuery || activeTab !== 'all' || selectedCategory !== 'all'
              ? 'Try adjusting your search query or filter selection.'
              : 'Add your first product to start managing POS inventory & stock alerts.'}
          </p>
          <button
            onClick={() => {
              setEditingProduct(null);
              setIsAddProductOpen(true);
            }}
            className="btn btn-primary"
            style={{ padding: '0.75rem 1.5rem', gap: '0.5rem', margin: '0 auto' }}
          >
            <Plus size={18} /> + Add First Product
          </button>
        </div>
      ) : (
        /* Product Cards Grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {processedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={(p) => {
                setEditingProduct(p);
                setIsAddProductOpen(true);
              }}
              onRestock={(p) => setRestockProduct(p)}
              onDelete={(id, name) => handleDeleteProduct(id, name)}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {(isAddProductOpen || editingProduct) && (
        <AddProductModal
          isOpen={isAddProductOpen || !!editingProduct}
          initialProduct={editingProduct}
          onClose={() => {
            setIsAddProductOpen(false);
            setEditingProduct(null);
          }}
          onSuccess={() => {
            setIsAddProductOpen(false);
            setEditingProduct(null);
            refetch();
          }}
          onOpenAddCategory={() => setIsAddCategoryOpen(true)}
        />
      )}

      {/* Add Category Modal */}
      {isAddCategoryOpen && (
        <AddCategoryModal
          isOpen={isAddCategoryOpen}
          onClose={() => setIsAddCategoryOpen(false)}
          onSuccess={() => {
            setIsAddCategoryOpen(false);
            refetch();
          }}
        />
      )}

      {/* Stock Adjustment / Restock Modal */}
      {restockProduct && (
        <RestockModal
          isOpen={!!restockProduct}
          product={restockProduct}
          onClose={() => setRestockProduct(null)}
          onSuccess={() => {
            setRestockProduct(null);
            refetch();
          }}
        />
      )}
    </div>
  );
};

export default ProductListPage;
