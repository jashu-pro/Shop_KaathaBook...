/* components/ui/Input.tsx */
import React, { useId } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  required,
  id,
  ...props
}, ref) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  return (
    <div className="form-group" style={{ marginBottom: '1rem', position: 'relative' }}>
      {label && (
        <label htmlFor={inputId} className="form-label" style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.875rem' }}>
          {label} {required && <span style={{ color: 'var(--error)' }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
        {leftIcon && (
          <div style={{ position: 'absolute', left: '1rem', display: 'flex', alignItems: 'center', color: 'var(--text-muted)', pointerEvents: 'none' }}>
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={`input-field ${error ? 'input-field-error' : ''} ${className}`}
          style={{
            paddingLeft: leftIcon ? '2.75rem' : '1.2rem',
            paddingRight: rightIcon ? '2.75rem' : '1.2rem',
            borderColor: error ? 'var(--error)' : undefined,
          }}
          {...props}
        />
        {rightIcon && (
          <div style={{ position: 'absolute', right: '1rem', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p id={errorId} className="input-error" style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.35rem', fontWeight: 500 }}>
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={helperId} className="helper-text" style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.35rem' }}>
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
