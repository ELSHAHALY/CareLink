import React from 'react'

const Loader = ({
  size = 'md',
  variant = 'spinner',
  color = '#007BFF',
  secondaryColor = '#00A676',
  text,
  isFullPage = false,
  className = '',
}) => {
  // Size configurations
  const sizes = {
    sm: { spinner: 'w-5 h-5 border-2', dot: 'w-2 h-2', text: 'text-xs' },
    md: { spinner: 'w-8 h-8 border-[3px]', dot: 'w-3 h-3', text: 'text-sm' },
    lg: { spinner: 'w-12 h-12 border-4', dot: 'w-4 h-4', text: 'text-base' },
  }

  const activeSize = sizes[size] || sizes.md

  // Inline styles for dynamic colors
  const primaryBg = { backgroundColor: color }
  const secondaryBg = { backgroundColor: secondaryColor }

  // Variants Mapping
  const variants = {
    spinner: (
      <div
        className={`animate-spin rounded-full border-gray-200 ${activeSize.spinner}`}
        style={{
          borderTopColor: color,
          borderRightColor: secondaryColor,
        }}
      />
    ),
    pulse: (
      <div className='relative flex items-center justify-center'>
        <div
          className={`animate-ping absolute rounded-full opacity-30 ${activeSize.spinner}`}
          style={primaryBg}
        />
        <div
          className={`rounded-full ${activeSize.spinner}`}
          style={primaryBg}
        />
      </div>
    ),
    dots: (
      <div className='flex items-center space-x-2'>
        <div
          className={`${activeSize.dot} rounded-full animate-bounce [animation-delay:-0.3s]`}
          style={primaryBg}
        />
        <div
          className={`${activeSize.dot} rounded-full animate-bounce [animation-delay:-0.15s]`}
          style={secondaryBg}
        />
        <div
          className={`${activeSize.dot} rounded-full animate-bounce`}
          style={primaryBg}
        />
      </div>
    ),
  }

  const loaderContent = (
    <div
      role='status'
      aria-live='polite'
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
    >
      {variants[variant] || variants.spinner}

      {text && (
        <p className={`font-medium text-[#343A40] ${activeSize.text}`}>
          {text}
        </p>
      )}

      <span className='sr-only'>{text || 'Loading...'}</span>
    </div>
  )

  if (isFullPage) {
    return (
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm'>
        {loaderContent}
      </div>
    )
  }

  return loaderContent
}

export default Loader
