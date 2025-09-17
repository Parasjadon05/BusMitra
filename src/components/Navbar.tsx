import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Assuming React Router for navigation
import { onAuthStateChanged, signOut } from 'firebase/auth'; // Firebase auth imports
import { auth } from '@/lib/firebase'; // Adjust path based on your project structure
import i18n from 'i18next'

function Navbar() {
  const [isOpen, setIsOpen] = useState(false); // State for mobile menu toggle
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Auth state
  const [userName, setUserName] = useState<string | null>(null); // Store user name
  const [loading, setLoading] = useState(true); // Loading state for auth check
  const [lang, setLang] = useState<string>(() => localStorage.getItem('i18nextLng') || 'en')

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value
    setLang(newLang)
    i18n.changeLanguage(newLang)
    localStorage.setItem('i18nextLng', newLang)
  }

  // Logout function
  const handleLogout = async () => {
    try {
      await signOut(auth);
      // State will update via onAuthStateChanged listener
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Sync auth state with localStorage and UI
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
          // Note: accessToken is not available on the User object
          // If needed for API calls, use user.getIdToken() which returns a Promise<string>
        };
        localStorage.setItem('currentUser', JSON.stringify(userData));
        setIsAuthenticated(true);
        setUserName(user.displayName || user.email?.split('@')[0] || 'User');
      } else {
        // User is signed out
        localStorage.removeItem('currentUser');
        setIsAuthenticated(false);
        setUserName(null);
      }
      setLoading(false); // Hide loading after first check
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Show loading skeleton while checking auth
  if (loading) {
    return (
      <nav className="bg-white text-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0">
              <div className="h-8 w-32 bg-gray-200 animate-pulse rounded" />
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex space-x-4">
                <div className="h-4 w-16 bg-gray-200 animate-pulse rounded" />
                <div className="h-4 w-16 bg-gray-200 animate-pulse rounded" />
                <div className="h-4 w-16 bg-gray-200 animate-pulse rounded" />
              </div>
              <div className="h-10 w-24 bg-gray-200 animate-pulse rounded" />
            </div>
            <div className="md:hidden">
              <div className="h-6 w-6 bg-gray-200 animate-pulse rounded" />
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white text-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/">
              <img className="h-8 w-auto" src="/logo.png" alt="Logo" />
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <select
              value={lang}
              onChange={handleLangChange}
              className="border rounded-md px-2 py-1 text-sm focus:outline-none"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="ta">தமிழ்</option>
              <option value="pa">ਪੰਜਾਬੀ</option>
            </select>

            <ul className="flex space-x-8">
              <li>
                <Link to="/" className="text-gray-600 hover:text-[#87281B] px-3 py-2 rounded-md text-lg font-medium transition-colors duration-200">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-600 hover:text-[#87281B] px-3 py-2 rounded-md text-lg font-medium transition-colors duration-200">
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-600 hover:text-[#87281B] px-3 py-2 rounded-md text-lg font-medium transition-colors duration-200">
                  Contact
                </Link>
              </li>
            </ul>
            {/* Auth Section - Welcome first, then Logout */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-3 bg-gray-50 px-4 py-2 rounded-full">
                  <span className="text-sm font-semibold text-gray-800">Welcome, {userName}</span>
                  <button
                    onClick={handleLogout}
                    className="bg-[#87281B] hover:bg-[#601c13] text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  to="/signin"
                  className="bg-[#87281B] hover:bg-[#601c13] text-white px-6 py-2 rounded-full text-sm font-semibold transition-colors duration-200 shadow-md"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-3">
            <select
              value={lang}
              onChange={handleLangChange}
              className="border rounded-md px-2 py-1 text-sm focus:outline-none"
            >
              <option value="en">EN</option>
              <option value="hi">हि</option>
              <option value="ta">த</option>
              <option value="pa">ਪੰ</option>
            </select>
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-800 hover:bg-gray-100 focus:outline-none transition-colors duration-200"
            >
              <span className="sr-only">Open main menu</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu - Full Screen */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 bg-white z-50 flex flex-col shadow-2xl">
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center space-x-2" onClick={toggleMenu}>
                <img className="h-8 w-auto" src="/logo.png" alt="Logo" />

              </Link>
              <button
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors duration-200"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex-grow overflow-y-auto p-6">
            <ul className="space-y-6">
              {isAuthenticated && (
                <li className="text-center py-4 border-b">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Welcome back!</h3>
                    <p className="text-lg font-medium text-[#87281B]">{userName}</p>
                  </div>
                </li>
              )}
              <li>
                <Link
                  to="/"
                  className="block text-xl font-semibold text-gray-700 hover:text-[#87281B] py-3 border-b border-gray-100 transition-colors duration-200"
                  onClick={toggleMenu}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="block text-xl font-semibold text-gray-700 hover:text-[#87281B] py-3 border-b border-gray-100 transition-colors duration-200"
                  onClick={toggleMenu}
                >
                   About
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="block text-xl font-semibold text-gray-700 hover:text-[#87281B] py-3 border-b border-gray-100 transition-colors duration-200"
                  onClick={toggleMenu}
                >
                   Contact
                </Link>
              </li>
              {isAuthenticated ? (
                <li className="pt-6">
                  <button
                    onClick={() => {
                      handleLogout();
                      toggleMenu();
                    }}
                    className="w-full bg-[#87281B] text-white py-3 rounded-lg text-xl font-semibold transition-colors duration-200 shadow-md"
                  >
                    Logout
                  </button>
                </li>
              ) : (
                <li className="pt-6">
                  <Link
                    to="/signin"
                    className="block w-full bg-[#87281B] hover:bg-[#601c13] text-white py-4 rounded-lg text-xl font-semibold text-center transition-colors duration-200 shadow-md"
                    onClick={toggleMenu}
                  >
                    Sign In
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;