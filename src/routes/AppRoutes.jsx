import { Routes, Route } from 'react-router-dom'
import MainLayout from '../components/layout/MainLayout'
import Home from '../pages/Home'
import DoctorsList from '../pages/DoctorsList'
import DoctorDetailPage from '../pages/DoctorProfile'
import BookAppointment from '../pages/BookAppointment'
import Dashboard from '../pages/Dashboard'
import DoctorDashboard from '../pages/DoctorDashboard'
import DoctorAppointments from '../pages/DoctorAppointments'
import DoctorOwnProfile from '../pages/DoctorProfilePage'
import Login from '../pages/Login'
import MyAppointments from '../pages/MyAppointments'
import Profile from '../pages/Profile'
import NotFound from '../pages/NotFound'

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public pages share the Navbar + Footer via MainLayout */}
      <Route element={<MainLayout />}>
        <Route path='/' element={<Home />} />
        <Route path='/doctors' element={<DoctorsList />} />
        <Route path='/doctors/:doctorId' element={<DoctorDetailPage />} />
        <Route path='/book-appointment' element={<BookAppointment />} />
        <Route path='/appointments' element={<MyAppointments />} />
        <Route path='/profile' element={<Profile />} />
        <Route path='*' element={<NotFound />} />
      </Route>

      {/* Standalone pages: no shared Navbar/Footer */}
      <Route path='/login' element={<Login />} />
      <Route path='/dashboard' element={<Dashboard />} />
      <Route path='/doctor/dashboard' element={<DoctorDashboard />} />
      <Route path='/doctor/appointments' element={<DoctorAppointments />} />
      <Route path='/doctor/profile' element={<DoctorOwnProfile />} />
    </Routes>
  )
}
