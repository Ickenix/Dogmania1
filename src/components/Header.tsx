import React, { useState, useEffect } from 'react';
import { Dog, Menu, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const isPublicRoute = ['/', '/login', '/register', '/pricing'].includes(location.pathname);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when changing routes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Only show header on public routes
  if (!isPublicRoute) {
    return null;
  }

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-blue-950/90 backdrop-blur-md py-3 shadow-lg' : 'bg-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Dog className="h-8 w-8 text-purple-400" />
            <span className="font-bold text-2xl tracking-tight">Dogmania</span>
          </Link>

          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/pricing" className="text-white hover:text-purple-300 transition-colors">
              Preise
            </Link>
            <Link to="/contact" className="text-white hover:text-purple-300 transition-colors">
              Kontakt
            </Link>
            {!session ? (
              <>
                <Link to="/login" className="text-white hover:text-purple-300 transition-colors">
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-full transition-all hover:shadow-lg"
                >
                  Registrieren
                </Link>
              </>
            ) : (
              <Link 
                to="/dashboard" 
                className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-full transition-all hover:shadow-lg"
              >
                Dashboard
              </Link>
            )}
          </nav>

          {/* Mobile menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div 
                className="md:hidden absolute top-full left-0 right-0 mt-2 bg-blue-900/90 backdrop-blur-lg overflow-hidden z-50"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="py-4 px-4 space-y-4">
                  <Link to="/pricing" className="block py-3 text-center hover:bg-white/10 transition-colors rounded-lg">
                    Preise
                  </Link>
                  <Link to="/contact" className="block py-3 text-center hover:bg-white/10 transition-colors rounded-lg">
                    Kontakt
                  </Link>
                  {!session ? (
                    <>
                      <Link to="/login" className="block py-3 text-center hover:bg-white/10 transition-colors rounded-lg">
                        Login
                      </Link>
                      <Link 
                        to="/register" 
                        className="block py-3 text-center bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors"
                      >
                        Registrieren
                      </Link>
                    </>
                  ) : (
                    <Link 
                      to="/dashboard" 
                      className="block py-3 text-center bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors"
                    >
                      Dashboard
                    </Link>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Header;