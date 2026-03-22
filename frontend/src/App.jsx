import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Navbar from './components/Navbar.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Simulate from './pages/Simulate.jsx'
import SimulationView from './pages/SimulationView.jsx'
import Report from './pages/Report.jsx'
import Compare from './pages/Compare.jsx'
import NotFound from './pages/NotFound.jsx'
import { ToastContainer } from './components/Toast'
import ErrorBoundary from './components/ErrorBoundary'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.PROD ? '/simulacra' : '/'}>
      <div style={{ background: '#0f1117', minHeight: '100vh' }}>
        <Navbar />
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/simulate" element={<Simulate />} />
            <Route path="/simulation/:id" element={<SimulationView />} />
            <Route path="/report/:id" element={<Report />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
        <ToastContainer />
      </div>
    </BrowserRouter>
  )
}
