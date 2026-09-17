import { useState } from 'react'
import Sidebar from './Sidebar'
import styles from './DashboardLayout.module.css'

export default function DashboardLayout({
  children,
  title = 'Dashboard',
  subtitle = '',
  action = null,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className={styles.layout}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
          aria-hidden='true'
        />
      )}

      <div className={styles.main}>
        <header className={styles.topbar}>
          <button
            type='button'
            className={styles.menuBtn}
            onClick={() => setSidebarOpen(true)}
            aria-label='Open navigation menu'
          >
            <span className={styles.menuIcon} aria-hidden='true'>
              ☰
            </span>
          </button>
          <div className={styles.topbarTitles}>
            <h1 className={styles.pageTitle}>{title}</h1>
            {subtitle && <p className={styles.pageSubtitle}>{subtitle}</p>}
          </div>
          {action && <div className={styles.topbarAction}>{action}</div>}
        </header>

        <main className={styles.content}>{children}</main>
      </div>
    </div>
  )
}
