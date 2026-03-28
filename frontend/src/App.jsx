import { BrowserRouter, Routes, Route, Suspense } from 'react-router-dom'
import { lazy } from 'react'
import './index.css'
import Navbar from './components/Navbar.jsx'
import { ToastContainer } from './components/Toast'
import ErrorBoundary from './components/ErrorBoundary'
import PageLoader from './components/PageLoader.jsx'

const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const Simulate = lazy(() => import('./pages/Simulate.jsx'))
const SimulationView = lazy(() => import('./pages/SimulationView.jsx'))
const Report = lazy(() => import('./pages/Report.jsx'))
const Compare = lazy(() => import('./pages/Compare.jsx'))
const MultiSeed = lazy(() => import('./pages/MultiSeed.jsx'))
const CompareView = lazy(() => import('./pages/CompareView.jsx'))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.PROD ? '/simulacra' : '/'}>
      <div style={{ background: '#0f1117', minHeight: '100vh' }}>
        <Navbar />
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/simulate" element={<Simulate />} />
              <Route path="/simulation/:id" element={<SimulationView />} />
              <Route path="/report/:id" element={<Report />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/compare-view" element={<CompareView />} />
              <Route path="/multi" element={<MultiSeed />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
        <ToastContainer />
      </div>
    </BrowserRouter>
  )
}
