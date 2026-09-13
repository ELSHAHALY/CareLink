import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import AppRoutes from './routes/AppRoutes'
import { AppointmentProvider } from './pages/MyAppointments'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppointmentProvider>
          <AppRoutes />
        </AppointmentProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
