import { Routes, Route } from 'react-router-dom'
import Home from '../pages/Home'
import DoctorsList from '../pages/DoctorsList'
import DoctorProfile from '../pages/DoctorProfile'
import BookAppointment from '../pages/BookAppointment'
import Dashboard from '../pages/Dashboard'
import Login from '../pages/Login'
import MyAppointments from '../pages/MyAppointments'
import Profile from '../pages/Profile'
import NotFound from '../pages/NotFound'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/doctors' element={<DoctorsList />} />
      <Route path='/doctors/:doctorId' element={<DoctorProfile />} />
      <Route path='/book-appointment' element={<BookAppointment />} />
      <Route path='/dashboard' element={<Dashboard />} />
      <Route path='/login' element={<Login />} />
      <Route path='/appointments' element={<MyAppointments />} />
      <Route path='/profile' element={<Profile />} />
      <Route path='*' element={<NotFound />} />
    </Routes>
  )
}
