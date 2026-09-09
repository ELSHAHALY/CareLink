import React from 'react'

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isFullWidth = false,
  disabled = false,
  isLoading = false,
  onClick,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  //  CareLink Color Palette
  const variants = {
    primary: 'bg-[#007BPF] hover:bg-[#0066d6] text-white focus:ring-[#007BPF]',

    teal: 'bg-[#00A676] hover:bg-[#008f65] text-white focus:ring-[#00A676]',

    secondary:
      'bg-[#F8F9FA] hover:bg-[#e9ecef] text-[#343A40] border border-gray-200 focus:ring-gray-300',

    outline:
      'border-2 border-[#007BPF] text-[#007BPF] hover:bg-[#007BPF] hover:text-white focus:ring-[#007BPF]',

    //  text hover effect
    ghost: 'text-[#343A40] hover:bg-[#F8F9FA] focus:ring-gray-300',
  }

  // Size variations
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  const widthStyle = isFullWidth ? 'w-full' : ''

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthStyle} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className='flex items-center gap-2'>
          <svg
            className='animate-spin h-4 w-4 text-current'
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
          >
            <circle
              className='opacity-25'
              cx='12'
              cy='12'
              r='10'
              stroke='currentColor'
              strokeWidth='4'
            ></circle>
            <path
              className='opacity-75'
              fill='currentColor'
              d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
            ></path>
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  )
}

export default Button
