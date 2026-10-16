/* features/inventory/components/ProductCard.tsx */
import React from 'react';
import { Package, Edit3, PackagePlus, Trash2, AlertTriangle, Tag } from 'lucide-react';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onRestock: (product: Product) => void;
  onDelete: (id: string, name: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onEdit,
  onRestock,
  onDelete
}) => {
  // Stock Status Definitions
  const isOutOfStock = product.stockQty <= 0;
  const isLowStock = !isOutOfStock && product.stockQty <= product.alertQty;

  // Profit Amount & Margin % Calculation (Display analytics only)
  const sellingPrice = product.price || 0;
  const costPrice = product.costPrice || 0;
  const profitAmount = sellingPrice - costPrice;
  const marginPercentage = sellingPrice > 0 ? Math.round((profitAmount / sellingPrice) * 100) : 0;

  return (
    <div
      className="glass-panel"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-card, 24px)',
        border: '1px solid var(--border-color)',
        padding: '1.25rem 1.35rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.03)',
        transition: 'all 200ms ease',
        position: 'relative'
      }}
    >
      {/* Top Header: Image / Icon, Name, Category & Stock Status Badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '16px',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', flexShrink: 0,
            border: '1px solid var(--border-color)'
          }}>
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Package size={26} />
            )}
          </div>

          <div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-heading)', lineHeight: 1.2 }}>
              {product.name}
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
              <span className="badge badge-neutral" style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem' }}>
                <Tag size={10} style={{ marginRight: '0.2rem' }} />
                {product.categoryName || 'General'}
              </span>
              {product.unit && (
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: '700' }}>
                  Per {product.unit}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stock Status Badge */}
        <span
          className={`badge ${
            isOutOfStock ? 'badge-error' : isLowStock ? 'badge-warning' : 'badge-success'
          }`}
          style={{ textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: '800', letterSpacing: '0.04em' }}
        >
          {isOutOfStock ? 'OUT OF STOCK' : isLowStock ? 'LOW STOCK' : 'IN STOCK'}
        </span>
      </div>

      {/* Pricing & Profit Analytics Bar */}
      <div style={{
        padding: '0.85rem 1rem',
        borderRadius: '16px',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '0.5rem',
        textAlign: 'center'
      }}>
        <div>
          <span style={{ fontSize: '0.675rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
            Selling Price
          </span>
          <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-heading)', marginTop: '0.1rem', display: 'block' }}>
            ₹{sellingPrice.toLocaleString('en-IN')}
          </span>
        </div>

        <div>
          <span style={{ fontSize: '0.675rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
            Cost Price
          </span>
          <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-muted)', marginTop: '0.1rem', display: 'block' }}>
            ₹{costPrice.toLocaleString('en-IN')}
          </span>
        </div>

        <div>
          <span style={{ fontSize: '0.675rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
            Margin
          </span>
          <span style={{ fontSize: '1.1rem', fontWeight: '800', color: marginPercentage > 0 ? 'var(--primary)' : 'var(--text-heading)', marginTop: '0.1rem', display: 'block' }}>
            {marginPercentage}%
          </span>
        </div>
      </div>

      {/* Stock Quantity Progress Indicator & SKU/Barcode */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.775rem', fontWeight: '700', marginBottom: '0.35rem' }}>
          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            Stock Quantity
          </span>
          <span style={{ color: isOutOfStock ? 'var(--error)' : isLowStock ? '#D97706' : 'var(--text-heading)' }}>
            <strong>{product.stockQty}</strong> {product.unit || 'pcs'} (Min: {product.alertQty})
          </span>
        </div>

        <div style={{ width: '100%', height: '7px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${Math.min(Math.round((product.stockQty / Math.max(product.alertQty * 2, 1)) * 100), 100)}%`,
            backgroundColor: isOutOfStock ? 'var(--error)' : isLowStock ? '#F59E0B' : 'var(--primary)',
            borderRadius: '10px',
            transition: 'width 300ms ease'
          }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
          <span>{product.barcode ? `📊 ${product.barcode}` : product.sku ? `SKU: ${product.sku}` : ''}</span>
          {(isLowStock || isOutOfStock) && (
            <span style={{ color: isOutOfStock ? 'var(--error)' : '#D97706', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <AlertTriangle size={12} /> {isOutOfStock ? 'Out of Stock Alert' : 'Low Stock Warning'}
            </span>
          )}
        </div>
      </div>

      {/* Quick Actions Grid: Edit | Restock | Delete */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', gap: '0.5rem', paddingTop: '0.25rem' }}>
        <button
          onClick={() => onRestock(product)}
          className="btn btn-primary"
          style={{ padding: '0.65rem', borderRadius: '14px', fontSize: '0.775rem', fontWeight: '800', gap: '0.35rem' }}
        >
          <PackagePlus size={16} /> Adjust Stock
        </button>

        <button
          onClick={() => onEdit(product)}
          className="btn btn-secondary"
          style={{ padding: '0.65rem', borderRadius: '14px', fontSize: '0.775rem', fontWeight: '700', gap: '0.35rem' }}
        >
          <Edit3 size={16} /> Edit
        </button>

        <button
          onClick={() => onDelete(product.id, product.name)}
          className="btn btn-secondary btn-icon"
          style={{ padding: '0.65rem', borderRadius: '14px', color: 'var(--error)', width: '100%' }}
          title="Delete Product"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
