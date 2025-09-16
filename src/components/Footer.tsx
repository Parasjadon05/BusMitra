import React from 'react'
import { Link } from 'react-router-dom'
import { Badge } from './ui/badge'

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="mb-4">
              <img src="/logo.png" alt="BusMitra Logo" className="h-8 w-auto" />
            </div>
            <p className="text-gray-600 mb-4 max-w-md">
              Making public transportation smarter, more reliable, and accessible for everyone. 
              Your trusted companion for seamless daily commutes.
            </p>
            <div className="flex space-x-4">
              <Badge variant="outline">Android App</Badge>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Features</h4>
            <ul className="space-y-2 text-[#87281B]">
              <li>Real-time Tracking</li>
              <li>Route Planning</li>
              <li>Smart Notifications</li>
              <li>Live Updates</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Support</h4>
            <ul className="space-y-2 text-gray-600">
              <li>
                <Link to="/help" className="hover:text-[#87281B]">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#87281B]">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-[#87281B]">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-[#87281B]">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t mt-8 pt-8 text-center text-gray-600">
          <p >&copy; 2025 <span className='text-[#87281B]'>BusMitra. </span>Making public transportation smarter for everyone.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer