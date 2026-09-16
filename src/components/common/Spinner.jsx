import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import '../../styles/spinner.css'

const AUTH_ROUTES = ['/login']

export default function NavigationLoader() {
  const location = useLocation()

  const previousPathRef = useRef(location.pathname)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const previousPath = previousPathRef.current
    const currentPath = location.pathname

    const isAuthNavigation =
      AUTH_ROUTES.includes(previousPath) || AUTH_ROUTES.includes(currentPath)

    if (isAuthNavigation || previousPath === currentPath) {
      previousPathRef.current = currentPath
      setLoading(false)
      return
    }
    previousPathRef.current = currentPath

    setLoading(true)

    const timer = setTimeout(() => {
      setLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [location.pathname])

  if (!loading) {
    return null
  }

  return (
    <div className='navigation-loader'>
      <span
        className='navigation-loader__spinner'
        role='status'
        aria-label='Loading page'
      />
    </div>
  )
}
