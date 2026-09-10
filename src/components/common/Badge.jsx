import React from 'react'

const Badge = ({
  children,
  variant = 'primary',
  size = 'md',
  rounded = 'full',
  dot = false,
  className = '',
  ...props
}) => {
  // Base layout styles
  const baseStyles = 'inline-flex items-center font-medium transition-colors'

  const variants = {
    primary: 'bg-[#007BPF]/10 text-[#007BPF] border border-[#007BPF]/20',

    teal: 'bg-[#00A676]/10 text-[#00A676] border border-[#00A676]/20',

    secondary: 'bg-[#F8F9FA] text-[#343A40] border border-gray-200',

    // Healthcare Status Alerts
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200',

    outline: 'bg-transparent text-[#343A40] border border-gray-300',
  }

  // Color status dot
  const dotColors = {
    primary: 'bg-[#007BPF]',
    teal: 'bg-[#00A676]',
    secondary: 'bg-[#343A40]',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    outline: 'bg-gray-400',
  }

  // Size variations
  const sizes = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  }

  // Border radius
  const roundedStyles = {
    full: 'rounded-full',
    md: 'rounded-md',
    none: 'rounded-none',
  }

  return (
    <span
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${roundedStyles[rounded]} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            dotColors[variant] || 'bg-current'
          }`}
          aria-hidden='true'
        />
      )}
      {children}
    </span>
  )
}

export default Badge
