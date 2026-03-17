import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Dashboard from './pages/Dashboard.jsx'
import Simulate from './pages/Simulate.jsx'
import SimulationView from './pages/SimulationView.jsx'
import Report from './pages/Report.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ background: '#0f1117', minHeight: '100vh' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/simulate" element={<Simulate />} />
          <Route path="/simulation/:id" element={<SimulationView />} />
          <Route path="/report/:id" element={<Report />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
