/* components/ui/Badge.tsx */
import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'udhaar' | 'jama';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  className = '',
  style,
  ...props
}) => {
  const getBadgeStyle = (): React.CSSProperties => {
    switch (variant) {
      case 'success':
        return { backgroundColor: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid rgba(16, 185, 129, 0.25)' };
      case 'warning':
        return { backgroundColor: 'var(--accent-light)', color: 'var(--accent)', border: '1px solid rgba(245, 158, 11, 0.25)' };
      case 'error':
        return { backgroundColor: 'var(--error-light)', color: 'var(--error)', border: '1px solid rgba(239, 68, 68, 0.25)' };
      case 'info':
        return { backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', border: '1px solid rgba(59, 130, 246, 0.25)' };
      case 'udhaar':
        return { backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', fontWeight: 700 };
      case 'jama':
        return { backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 700 };
      case 'neutral':
      default:
        return { backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' };
    }
  };

  return (
    <span
      className={`badge ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.25rem 0.75rem',
        fontSize: '0.75rem',
        fontWeight: 600,
        borderRadius: 'var(--radius-full, 9999px)',
        whiteSpace: 'nowrap',
        ...getBadgeStyle(),
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
