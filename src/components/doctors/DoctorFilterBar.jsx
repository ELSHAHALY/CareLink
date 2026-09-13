import { FcSearch } from 'react-icons/fc'

export default function DoctorFilterBar({ filters, onFilterChange, onClear }) {
  return (
    <section className='doctor-filters'>
      <div className='doctor-search'>
        <span className='search-icon'>
          <FcSearch size={20} />
        </span>

        <input
          type='text'
          placeholder='Search by doctor name or specialty...'
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
        />
      </div>

      <div className='doctor-filter-options'>
        <select
          value={filters.specialty}
          onChange={(e) => onFilterChange('specialty', e.target.value)}
        >
          <option value=''>All Specialties</option>
          <option value='Cardiologist'>Cardiology</option>
          <option value='Neurologist'>Neurology</option>
          <option value='Dermatologist'>Dermatology</option>
        </select>

        <select
          value={filters.city}
          onChange={(e) => onFilterChange('city', e.target.value)}
        >
          <option value=''>All Cities</option>
          <option value='New York'>New York</option>
          <option value='San Francisco'>San Francisco</option>
          <option value='Chicago'>Chicago</option>
        </select>

        <select
          value={filters.rating}
          onChange={(e) => onFilterChange('rating', e.target.value)}
        >
          <option value=''>Any Rating</option>
          <option value='4'>4+ Stars</option>
          <option value='4.5'>4.5+ Stars</option>
        </select>

        <button type='button' className='clear-filters' onClick={onClear}>
          Clear Filters
        </button>
      </div>
    </section>
  )
}
