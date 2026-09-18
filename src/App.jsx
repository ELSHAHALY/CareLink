import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AppointmentProvider } from './context/AppointmentContext'
import AppRoutes from './routes/AppRoutes'
import Spinner from './components/common/Spinner'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppointmentProvider>
          <Spinner />
          <AppRoutes />
        </AppointmentProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
