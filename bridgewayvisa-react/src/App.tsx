import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './auth/ProtectedRoute'
import Navbar from './components/Navbar'
import About from './components/About'
import MainOffice from './components/MainOffice'
import CebuOffice from './components/CebuOffice'
import OfficeLocation from './components/OfficeLocation'
import Services from './components/Services'
import FeaturedPrograms from './components/FeaturedPrograms'
import Foundation from './components/Foundation'
import Team from './components/Team'
import Testimonials from './components/Testimonials'
import UserReviews from './components/UserReviews'
import Partners from './components/Partners'
import Payment from './components/Payment'
import Contact from './components/Contact'
import Footer from './components/Footer'
import BubbleChat from './components/BubbleChat'
import SectionDivider from './components/SectionDivider'
import AdminLogin from './admin/AdminLogin'
import AdminApp from './admin/AdminApp'
import AgentLogin from './agent/AgentLogin'
import AgentApp from './agent/AgentApp'

function PublicSite() {
  return (
    <div className="bg-zinc-950 min-h-screen">
      <Navbar />
      <About />
      <SectionDivider />
      <MainOffice />
      <SectionDivider />
      <CebuOffice />
      <SectionDivider />
      <OfficeLocation />
      <SectionDivider />
      <Services />
      <SectionDivider />
      <FeaturedPrograms />
      <SectionDivider />
      <Foundation />
      <SectionDivider />
      <Team />
      <SectionDivider />
      <Testimonials />
      <SectionDivider />
      <UserReviews />
      <SectionDivider />
      <Partners />
      <SectionDivider />
      <Payment />
      <SectionDivider />
      <Contact />
      <SectionDivider />
      <Footer />
      <BubbleChat />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicSite />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminApp />
          </ProtectedRoute>
        }
      />
      <Route path="/agent/login" element={<AgentLogin />} />
      <Route
        path="/agent/*"
        element={
          <ProtectedRoute allowedRole="agent">
            <AgentApp />
          </ProtectedRoute>
        }
      />
      <Route
        path="*"
        element={
          <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-white mb-4">404</h1>
              <p className="text-zinc-500">Page not found</p>
              <a
                href="/"
                className="inline-block mt-4 text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                &larr; Back to home
              </a>
            </div>
          </div>
        }
      />
    </Routes>
  )
}
