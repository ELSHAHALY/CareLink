import React from 'react'

const STATUS_MAP = {
  scheduled: {
    label: 'Scheduled',
    className: 'bg-blue-50 text-blue-700',
  },
  completed: {
    label: 'Completed',
    className: 'bg-emerald-50 text-emerald-700',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-rose-50 text-rose-700',
  },
}

const Badge = ({
  children,
  status,
  variant = 'primary',
  size = 'md',
  rounded = 'full',
  dot = false,
  className = '',
  ...props
}) => {
  // Status badges used by appointments
  if (status) {
    const config = STATUS_MAP[status] || STATUS_MAP.scheduled

    return (
      <span
        className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${config.className} ${className}`}
        aria-label={`Status: ${config.label}`}
        {...props}
      >
        {config.label}
      </span>
    )
  }

  // General-purpose badge styles
  const baseStyles = 'inline-flex items-center font-medium transition-colors'

  const variants = {
    primary: 'bg-[#007BFF]/10 text-[#007BFF] border border-[#007BFF]/20',

    teal: 'bg-[#00A676]/10 text-[#00A676] border border-[#00A676]/20',

    secondary: 'bg-[#F8F9FA] text-[#343A40] border border-gray-200',

    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',

    warning: 'bg-amber-50 text-amber-700 border border-amber-200',

    danger: 'bg-rose-50 text-rose-700 border border-rose-200',

    outline: 'bg-transparent text-[#343A40] border border-gray-300',
  }

  const dotColors = {
    primary: 'bg-[#007BFF]',
    teal: 'bg-[#00A676]',
    secondary: 'bg-[#343A40]',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    outline: 'bg-gray-400',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  }

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
