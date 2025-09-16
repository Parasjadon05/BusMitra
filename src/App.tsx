import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import BusDiscovery from './pages/BusDiscovery'
import BusDetails from './pages/BusDetails'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Signin from './pages/Signin'
import FinishSignin from './pages/FinishSignin'
import About from './pages/About'
import Contact from './pages/Contact'

function App() {
  return (
    <div>
      <Navbar />
       <Routes>

      <Route path="/" element={<LandingPage />} />
      <Route path="/discover" element={<BusDiscovery />} />
      <Route path="/bus/:busId" element={<BusDetails />} />
      <Route path="/signin" element={<Signin />} />
      <Route path="/finish-signin" element={<FinishSignin />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
    </Routes>
    <Footer />
    </div>
   
  )
}

export default App
