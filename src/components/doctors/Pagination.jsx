import '../../styles/pagination.css'

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  return (
    <nav className='pagination' aria-label='Doctors Pagination'>
      <button
        type='button'
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Previous
      </button>

      {Array.from({ length: totalPages }, (_, index) => {
        const page = index + 1

        return (
          <button
            key={page}
            type='button'
            className={currentPage === page ? 'active' : ''}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        )
      })}

      <button
        type='button'
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
      </button>
    </nav>
  )
}
