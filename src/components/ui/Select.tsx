/* components/ui/Select.tsx */
import React, { useId } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  helperText?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  options,
  placeholder,
  error,
  helperText,
  className = '',
  required,
  id,
  ...props
}, ref) => {
  const generatedId = useId();
  const selectId = id || generatedId;
  const errorId = `${selectId}-error`;
  const helperId = `${selectId}-helper`;

  return (
    <div className="form-group" style={{ marginBottom: '1rem' }}>
      {label && (
        <label htmlFor={selectId} className="form-label" style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.875rem' }}>
          {label} {required && <span style={{ color: 'var(--error)' }}>*</span>}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : helperText ? helperId : undefined}
        className={`input-field ${error ? 'input-field-error' : ''} ${className}`}
        style={{
          borderColor: error ? 'var(--error)' : undefined,
          cursor: props.disabled ? 'not-allowed' : 'pointer',
          appearance: 'auto',
        }}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
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

Select.displayName = 'Select';

export default Select;
