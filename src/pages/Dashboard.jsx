import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  CheckCircle2,
  Activity,
  Plus,
  Clock,
  MapPin,
  XCircle,
  RefreshCw,
  ChevronRight,
  Stethoscope,
} from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import { useAppointments } from '../hooks/useAppointments'
import Badge from '../components/common/Badge'
import Button from '../components/common/Button'
import Loader from '../components/common/Loader'
import EmptyState from '../components/common/EmptyState'

const Dashboard = () => {
  const { user } = useAuth() || {
    user: { name: 'سلمى أحمد', email: 'salma@example.com' },
  }
  const { appointments, isLoading, error, cancelAppointment } =
    useAppointments() || {
      appointments: [],
      isLoading: false,
      error: null,
      cancelAppointment: () => {},
    }

  const [activeTab, setActiveTab] = useState('upcoming')

  const filterAppointments = () => {
    if (!appointments) return []

    const now = new Date()
    return appointments.filter((app) => {
      const appDate = new Date(app.start || app.date)
      if (activeTab === 'upcoming') {
        return appDate >= now && app.status !== 'cancelled'
      }
      if (activeTab === 'past') {
        return appDate < now && app.status !== 'cancelled'
      }
      if (activeTab === 'cancelled') {
        return app.status === 'cancelled'
      }
      return true
    })
  }

  const filteredList = filterAppointments()

  const totalUpcoming =
    appointments?.filter(
      (a) =>
        new Date(a.start || a.date) >= new Date() && a.status !== 'cancelled',
    ).length || 0
  const totalCompleted =
    appointments?.filter(
      (a) =>
        new Date(a.start || a.date) < new Date() && a.status !== 'cancelled',
    ).length || 0

  return (
    <div className='min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8 font-sans'>
      <div className='max-w-7xl mx-auto space-y-8'>
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className='flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300'
        >
          <div>
            <h1 className='text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight'>
              أهلاً بك مجدداً،{' '}
              <span className='bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent'>
                {user?.name || 'مريضنا العزيز'}
              </span>{' '}
              👋
            </h1>
            <p className='text-slate-500 text-sm sm:text-base mt-2 leading-relaxed'>
              تتبع مواعيدك الطبية، راجع تفاصيل الزيارات، وادارة رعايتك الصحية
              بكل سهولة.
            </p>
          </div>
          <div className='flex items-center gap-3'>
            <Button
              variant='primary'
              onClick={() => (window.location.href = '/doctors')}
              className='flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all duration-200 shadow-lg shadow-blue-500/20 text-white px-5 py-3 rounded-2xl font-medium'
            >
              <Plus className='w-5 h-5' />
              <span>حجز موعد جديد</span>
            </Button>
          </div>
        </motion.div>

        {/* Analytics & Overview Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          {/* Card 1 */}
          <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className='bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-blue-100 transition-all duration-300 flex items-center gap-5 group'
          >
            <div className='p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300'>
              <Calendar className='w-7 h-7' />
            </div>
            <div>
              <p className='text-xs font-semibold text-slate-400 uppercase tracking-wider'>
                المواعيد القادمة
              </p>
              <h3 className='text-3xl font-black text-slate-800 mt-1'>
                {totalUpcoming}
              </h3>
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className='bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-teal-100 transition-all duration-300 flex items-center gap-5 group'
          >
            <div className='p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300'>
              <CheckCircle2 className='w-7 h-7' />
            </div>
            <div>
              <p className='text-xs font-semibold text-slate-400 uppercase tracking-wider'>
                الزيارات المكتملة
              </p>
              <h3 className='text-3xl font-black text-slate-800 mt-1'>
                {totalCompleted}
              </h3>
            </div>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className='bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-teal-100 transition-all duration-300 flex items-center gap-5 group'
          >
            <div className='p-4 bg-teal-50 text-teal-600 rounded-2xl group-hover:bg-teal-600 group-hover:text-white transition-colors duration-300'>
              <Activity className='w-7 h-7 animate-pulse' />
            </div>
            <div>
              <p className='text-xs font-semibold text-slate-400 uppercase tracking-wider'>
                ربط المعايير الطبية FHIR
              </p>
              <span className='inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 mt-2 border border-emerald-200/60'>
                <span className='w-2 h-2 rounded-full bg-emerald-500 animate-ping' />
                متصل (R4 Standard)
              </span>
            </div>
          </motion.div>
        </div>

        {/* Main Content Area: Appointments Management */}
        <div className='bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8'>
          {/* Navigation Tabs */}
          <div className='flex border-b border-slate-100 mb-8 gap-8 relative overflow-x-auto'>
            {[
              { id: 'upcoming', label: `القادمة (${totalUpcoming})` },
              { id: 'past', label: 'الزيارات السابقة' },
              { id: 'cancelled', label: 'الملغاة' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 font-bold text-sm sm:text-base transition-all duration-200 relative whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-blue-600'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId='activeTabUnderline'
                    className='absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-teal-400 rounded-full'
                  />
                )}
              </button>
            ))}
          </div>

          {/* Dynamic Content States */}
          {isLoading ? (
            <div className='py-16'>
              <Loader text='جاري جلب المواعيد من FHIR...' />
            </div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className='p-5 bg-rose-50 text-rose-700 rounded-2xl text-sm border border-rose-100 text-center flex items-center justify-center gap-2'
            >
              <XCircle className='w-5 h-5 text-rose-500' />
              <span>تعذر تحميل المواعيد: {error}</span>
            </motion.div>
          ) : filteredList.length === 0 ? (
            <EmptyState
              title={`لا توجد مواعيد ${
                activeTab === 'upcoming'
                  ? 'قادمة'
                  : activeTab === 'past'
                  ? 'سابقة'
                  : 'ملغاة'
              }`}
              description='لم نجد أي مواعيد مسجلة في القائمة الحالية.'
              action={
                activeTab === 'upcoming' ? (
                  <Button
                    variant='teal'
                    onClick={() => (window.location.href = '/doctors')}
                    className='mt-4'
                  >
                    البحث عن طبيب
                  </Button>
                ) : null
              }
            />
          ) : (
            <AnimatePresence mode='wait'>
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className='grid grid-cols-1 gap-4'
              >
                {filteredList.map((item) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ scale: 1.005 }}
                    transition={{ duration: 0.2 }}
                    className='flex flex-col md:flex-row md:items-center justify-between p-5 sm:p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all bg-white gap-5 group'
                  >
                    <div className='flex items-start gap-4'>
                      <div className='relative'>
                        <img
                          src={
                            item.doctorImage || 'https://via.placeholder.com/60'
                          }
                          alt={item.doctorName || 'Doctor'}
                          className='w-16 h-16 rounded-2xl object-cover border-2 border-slate-100 bg-slate-50 shadow-sm'
                        />
                        <div className='absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-sm'>
                          <Stethoscope className='w-3.5 h-3.5 text-blue-600' />
                        </div>
                      </div>

                      <div className='space-y-1'>
                        <div className='flex items-center gap-3 flex-wrap'>
                          <h4 className='font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors'>
                            {item.doctorName || 'د. طبيب ممارس'}
                          </h4>
                          <Badge
                            variant={
                              item.status === 'booked' ||
                              item.status === 'confirmed'
                                ? 'teal'
                                : item.status === 'cancelled'
                                ? 'danger'
                                : 'secondary'
                            }
                            dot
                          >
                            {item.status || 'مؤكد'}
                          </Badge>
                        </div>

                        <p className='text-sm font-semibold text-blue-600'>
                          {item.specialty || 'الطب العام'}
                        </p>

                        <div className='flex flex-wrap items-center gap-4 pt-1 text-xs font-medium text-slate-500'>
                          <span className='flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg'>
                            <Calendar className='w-3.5 h-3.5 text-slate-400' />
                            {item.date || '2026-10-15'}
                          </span>
                          <span className='flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg'>
                            <Clock className='w-3.5 h-3.5 text-slate-400' />
                            {item.time || '10:00 AM'}
                          </span>
                          <span className='flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg'>
                            <MapPin className='w-3.5 h-3.5 text-slate-400' />
                            {item.clinic || 'المركز الطبي الرئيسي'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons depending on state */}
                    <div className='flex items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 justify-end'>
                      {activeTab === 'upcoming' && (
                        <>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => cancelAppointment(item.id)}
                            className='text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-xl px-4 py-2 font-semibold transition-colors'
                          >
                            إلغاء
                          </Button>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() =>
                              (window.location.href = `/doctors/${
                                item.doctorId || ''
                              }`)
                            }
                            className='rounded-xl px-4 py-2 border-slate-200 hover:border-slate-300 font-semibold flex items-center gap-1'
                          >
                            <span>صفحة الطبيب</span>
                            <ChevronRight className='w-4 h-4' />
                          </Button>
                        </>
                      )}
                      {activeTab === 'past' && (
                        <Button
                          variant='teal'
                          size='sm'
                          onClick={() =>
                            (window.location.href = `/doctors/${
                              item.doctorId || ''
                            }`)
                          }
                          className='rounded-xl px-4 py-2 font-semibold flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                        >
                          <RefreshCw className='w-4 h-4' />
                          <span>إعادة الحجز</span>
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
