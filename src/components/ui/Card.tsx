/* components/ui/Card.tsx */
import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'normal' | 'glass';
  hoverElevation?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'normal',
  hoverElevation = false,
  children,
  className = '',
  style,
  ...props
}) => {
  const cardClass = variant === 'glass' ? 'glass-card' : 'onboarding-card';
  return (
    <div
      className={`${cardClass} ${className}`}
      style={{
        padding: '1.5rem',
        borderRadius: 'var(--radius-card, 24px)',
        transition: 'transform var(--transition-normal), box-shadow var(--transition-normal)',
        ...(hoverElevation ? { cursor: 'pointer' } : {}),
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', style, ...props }) => (
  <div className={`card-header ${className}`} style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', ...style }} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, className = '', style, ...props }) => (
  <h3 className={`card-title ${className}`} style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-heading)', margin: 0, ...style }} {...props}>
    {children}
  </h3>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', style, ...props }) => (
  <div className={`card-content ${className}`} style={{ color: 'var(--text-body)', ...style }} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', style, ...props }) => (
  <div className={`card-footer ${className}`} style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', ...style }} {...props}>
    {children}
  </div>
);

export default Card;
