import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
      <h1>404</h1>
      <p>The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link to='/'>Go back home</Link>
    </div>
  )
}
