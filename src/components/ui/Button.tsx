/* components/ui/Button.tsx */
import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'primary':
        return 'btn-primary';
      case 'secondary':
        return 'btn-secondary';
      case 'accent':
        return 'btn-accent';
      case 'danger':
        return 'btn-danger';
      case 'outline':
        return 'btn-outline';
      case 'ghost':
        return 'btn-ghost';
      default:
        return 'btn-primary';
    }
  };

  const getSizeStyle = (): React.CSSProperties => {
    switch (size) {
      case 'sm':
        return { padding: '0.4rem 0.9rem', fontSize: '0.825rem', borderRadius: '12px' };
      case 'lg':
        return { padding: '1.1rem 2.2rem', fontSize: '1.05rem', borderRadius: '22px' };
      case 'md':
      default:
        return {};
    }
  };

  return (
    <button
      className={`btn ${getVariantClass()} ${className}`}
      style={{ ...getSizeStyle(), opacity: disabled || isLoading ? 0.65 : 1, cursor: disabled || isLoading ? 'not-allowed' : 'pointer' }}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} aria-label="Loading" />
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};

export default Button;
