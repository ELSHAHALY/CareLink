import { useState } from 'react'
import Sidebar from './Sidebar'
import styles from './DashboardLayout.module.css'

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className={styles.layout}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={styles.main}>
        <header className={styles.topbar}>
          <button
            type='button'
            className={styles.menuBtn}
            onClick={() => setSidebarOpen(true)}
            aria-label='Open navigation menu'
          >
            ☰
          </button>
          <span className={styles.topbarTitle}>Dashboard</span>
        </header>

        <main className={styles.content}>{children}</main>
      </div>
    </div>
  )
}
