import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Nav from './components/Nav'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import NewsletterGuidePage from './pages/NewsletterGuidePage'
import SocialMediaPage from './pages/SocialMediaPage'
import FreeToolsPage from './pages/FreeToolsPage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/newsletter-guide" element={<NewsletterGuidePage />} />
            <Route path="/social-media-guide" element={<SocialMediaPage />} />
            <Route path="/free-tools" element={<FreeToolsPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
