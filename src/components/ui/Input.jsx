import React, { forwardRef } from 'react'
import styles from './Input.module.css'
const Input = forwardRef(({
  label,
  error,
  hint,
  prefix: Prefix,
  suffix: Suffix,
  type = 'text',
  className = '',
  containerClassName = '',
  size = 'md',
  ...props
}, ref) => {
  return (
    <div className={`${styles.container} ${containerClassName}`}>
      {label && (
        <label className={styles.label}>
          {label}
          {props.required && <span className={styles.required}>*</span>}
        </label>
      )}
      <div className={`${styles.inputWrapper} ${styles[size]} ${error ? styles.hasError : ''}`}>
        {Prefix && (
          <span className={styles.prefix}>
            {typeof Prefix === 'string' ? Prefix : <Prefix size={16} />}
          </span>
        )}
        <input
          ref={ref}
          type={type}
          className={`${styles.input} ${className} ${Prefix ? styles.hasPrefix : ''} ${Suffix ? styles.hasSuffix : ''}`}
          {...props}
        />
        {Suffix && (
          <span className={styles.suffix}>
            {typeof Suffix === 'string' ? Suffix : <Suffix size={16} />}
          </span>
        )}
      </div>
      {error && <p className={styles.error}>{error}</p>}
      {hint && !error && <p className={styles.hint}>{hint}</p>}
    </div>
  )
})
Input.displayName = 'Input'
export default Input