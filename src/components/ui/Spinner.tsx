/* components/ui/Spinner.tsx */
import React from 'react';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'white' | 'muted';
  className?: string;
  style?: React.CSSProperties;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  className = '',
  style,
}) => {
  const getSizePixels = () => {
    switch (size) {
      case 'sm':
        return 16;
      case 'lg':
        return 36;
      case 'md':
      default:
        return 24;
    }
  };

  const getColorStyle = () => {
    switch (variant) {
      case 'white':
        return { borderLeftColor: '#FFFFFF', borderColor: 'rgba(255, 255, 255, 0.25)' };
      case 'muted':
        return { borderLeftColor: 'var(--text-muted)', borderColor: 'var(--border-color)' };
      case 'primary':
      default:
        return { borderLeftColor: 'var(--primary)', borderColor: 'var(--primary-light)' };
    }
  };

  const px = getSizePixels();

  return (
    <div
      className={`spinner ${className}`}
      style={{
        width: `${px}px`,
        height: `${px}px`,
        borderWidth: size === 'sm' ? '2px' : '3px',
        borderStyle: 'solid',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        ...getColorStyle(),
        ...style,
      }}
      role="status"
      aria-label="Loading"
    />
  );
};

export default Spinner;
