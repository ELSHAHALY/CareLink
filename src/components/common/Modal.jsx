import React, { useEffect } from 'react'

const Modal = ({
  isOpen = false,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // ESC key press to close
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Modal sizing
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose()
    }
  }

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity animate-fadeIn'
      onClick={handleOverlayClick}
      aria-modal='true'
      role='dialog'
    >
      <div
        className={`w-full bg-white rounded-xl shadow-xl border border-gray-100 transform transition-all overflow-hidden ${sizes[size]}`}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className='flex items-center justify-between px-6 py-4 border-b border-gray-100'>
            {title && (
              <h3 className='text-lg font-semibold text-[#343A40]'>{title}</h3>
            )}
            {showCloseButton && (
              <button
                type='button'
                onClick={onClose}
                className='text-gray-400 hover:text-[#343A40] hover:bg-gray-100 p-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#007BPF]'
                aria-label='Close'
              >
                <svg
                  className='w-5 h-5'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className='px-6 py-4 text-[#343A40] max-h-[75vh] overflow-y-auto'>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className='flex items-center justify-end gap-3 px-6 py-4 bg-[#F8F9FA] border-t border-gray-100'>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal
