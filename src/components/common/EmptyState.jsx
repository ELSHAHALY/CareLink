import React from 'react'

const EmptyState = ({
  icon,
  title = 'No Data Available',
  description = 'There are no items to display at this time.',
  action,
  size = 'md',
  className = '',
}) => {
  // Size configurations
  const sizes = {
    sm: {
      container: 'p-6',
      iconWrapper: 'w-12 h-12 text-xl',
      title: 'text-base',
      description: 'text-xs',
    },
    md: {
      container: 'p-8',
      iconWrapper: 'w-16 h-16 text-2xl',
      title: 'text-lg',
      description: 'text-sm',
    },
    lg: {
      container: 'p-12',
      iconWrapper: 'w-20 h-20 text-3xl',
      title: 'text-xl',
      description: 'text-base',
    },
  }

  const DefaultIcon = (
    <svg
      className='w-8 h-8 text-[#007BPF]'
      fill='none'
      viewBox='0 0 24 24'
      stroke='currentColor'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={1.5}
        d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
      />
    </svg>
  )

  return (
    <div
      className={`flex flex-col items-center justify-center text-center bg-[#F8F9FA]/60 border border-dashed border-gray-200 rounded-2xl ${sizes[size].container} ${className}`}
    >
      {/* Icon Wrapper */}
      <div
        className={`flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 mb-4 ${sizes[size].iconWrapper}`}
      >
        {icon || DefaultIcon}
      </div>

      {/* Title */}
      <h3 className={`font-semibold text-[#343A40] ${sizes[size].title}`}>
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className={`mt-1 text-gray-500 max-w-sm ${sizes[size].description}`}>
          {description}
        </p>
      )}

      {action && <div className='mt-6'>{action}</div>}
    </div>
  )
}

export default EmptyState
