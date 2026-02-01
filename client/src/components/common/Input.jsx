import { forwardRef } from 'react';
import './Input.css';

const Input = forwardRef(({
  label,
  type = 'text',
  error,
  helperText,
  fullWidth = true,
  className = '',
  ...props
}, ref) => {
  return (
    <div className={`input-wrapper ${fullWidth ? 'input-wrapper--full' : ''} ${className}`}>
      {label && (
        <label className="input-wrapper__label">
          {label}
          {props.required && <span className="input-wrapper__required">*</span>}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        className={`input-wrapper__input ${error ? 'input-wrapper__input--error' : ''}`}
        {...props}
      />
      {(error || helperText) && (
        <span className={`input-wrapper__helper ${error ? 'input-wrapper__helper--error' : ''}`}>
          {error || helperText}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
