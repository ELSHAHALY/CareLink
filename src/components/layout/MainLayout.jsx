import { useRef } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import styles from './MainLayout.module.css'

export default function MainLayout() {
  const chatbotOpenRef = useRef(null)

  return (
    <div className={styles.mainLayout}>
      <Navbar />
      <main className={styles.mainLayoutContent}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}