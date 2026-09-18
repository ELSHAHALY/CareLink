import { useRef } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import AIChatbot from './AIChatbot'
import '../../styles/layout.css'

export default function MainLayout() {
  const chatbotOpenRef = useRef(null)

  return (
    <div className='main-layout'>
      <Navbar />
      <main className='main-layout__content'>
        <Outlet />
      </main>
      <Footer onHelpCenterClick={() => chatbotOpenRef.current?.()} />
      <AIChatbot onRegisterOpen={(fn) => { chatbotOpenRef.current = fn }} />
    </div>
  )
}
