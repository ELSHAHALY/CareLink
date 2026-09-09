import { Routes, Route } from 'react-router-dom'
import MainLayout from '../components/layout/MainLayout'
import DoctorsList from '../pages/DoctorsList'
import DoctorProfile from '../pages/DoctorProfile'
import BookAppointment from '../pages/BookAppointment'
import Dashboard from '../pages/Dashboard'
import Login from '../pages/Login'
import MyAppointments from '../pages/MyAppointments'
import Profile from '../pages/Profile'
import NotFound from '../pages/NotFound'
import { Home } from 'lucide-react'

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public pages share the Navbar + Footer via MainLayout */}
      <Route element={<MainLayout />}>
        <Route path='/' element={<Home />} />
        <Route path='/doctors' element={<DoctorsList />} />
        <Route path='/doctors/:doctorId' element={<DoctorProfile />} />
        <Route path='/book-appointment' element={<BookAppointment />} />
        <Route path='/appointments' element={<MyAppointments />} />
        <Route path='/profile' element={<Profile />} />
        <Route path='*' element={<NotFound />} />
      </Route>

      {/* Standalone pages: no shared Navbar/Footer */}
      <Route path='/login' element={<Login />} />
      <Route path='/dashboard' element={<Dashboard />} />
    </Routes>
  )
}
