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
import Register from '../pages/Register'
import DoctorRegister from '../pages/DoctorRegister'
import ForgotPassword from '../pages/ForgotPassword'
import ResetPassword from '../pages/ResetPassword'
import AdminDoctors from '../pages/AdminDoctors'
import MyAppointments from '../pages/MyAppointments'
import Profile from '../pages/Profile'
import NotFound from '../pages/NotFound'
import RequireAuth from '../components/auth/RequireAuth'
import RequireRole from '../components/auth/RequireRole'

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public pages share the Navbar + Footer via MainLayout */}
      <Route element={<MainLayout />}>
        <Route path='/' element={<Home />} />
        <Route path='/doctors' element={<DoctorsList />} />
        <Route path='/doctors/:doctorId' element={<DoctorDetailPage />} />
        <Route path='/book-appointment' element={<BookAppointment />} />
        <Route
          path='/appointments'
          element={
            <RequireAuth>
              <MyAppointments />
            </RequireAuth>
          }
        />
        <Route
          path='/profile'
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />
        <Route path='*' element={<NotFound />} />
      </Route>

      {/* Auth pages (standalone) */}
      <Route path='/login' element={<Login />} />
      <Route path='/register' element={<Register />} />
      <Route path='/doctor/register' element={<DoctorRegister />} />
      <Route path='/forgot-password' element={<ForgotPassword />} />
      <Route path='/reset-password' element={<ResetPassword />} />

      {/* Dashboards — role guarded */}
      <Route
        path='/dashboard'
        element={
          <RequireRole roles={['patient']}>
            <Dashboard />
          </RequireRole>
        }
      />
      <Route
        path='/doctor/dashboard'
        element={
          <RequireRole roles={['doctor']}>
            <DoctorDashboard />
          </RequireRole>
        }
      />
      <Route
        path='/doctor/appointments'
        element={
          <RequireRole roles={['doctor']}>
            <DoctorAppointments />
          </RequireRole>
        }
      />
      <Route
        path='/doctor/profile'
        element={
          <RequireRole roles={['doctor']}>
            <DoctorOwnProfile />
          </RequireRole>
        }
      />
      <Route
        path='/admin/doctors'
        element={
          <RequireRole roles={['admin']}>
            <AdminDoctors />
          </RequireRole>
        }
      />
    </Routes>
  )
}
