import { useState } from 'react';
import { Link, Form, useLocation } from 'react-router';
import { Avatar, Logo } from './ui';
import type { User } from '../lib/auth';

interface NavigationProps {
  user: User;
}

export function Navigation({ user }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  const getNavLinkClasses = (path: string, isMobile = false) => {
    const isActive = location.pathname === path || 
      (path !== '/' && location.pathname.startsWith(path));
    
    const baseClasses = isMobile 
      ? "block px-3 py-2 rounded-md text-base font-medium transition-colors"
      : "px-3 py-2 rounded-md text-sm font-medium transition-colors";
    
    if (isActive) {
      return `${baseClasses} bg-green-100 text-green-800`;
    }
    
    return `${baseClasses} text-gray-700 hover:text-green-600 ${isMobile ? 'hover:bg-gray-50' : ''}`;
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Logo size="sm" />
              <span className="text-xl font-bold text-gray-900">Scaletta Golf Trip</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/"
              className={getNavLinkClasses('/')}
            >
              Home
            </Link>
            
            <Link
              to="/golfers"
              className={getNavLinkClasses('/golfers')}
            >
              Golfers
            </Link>
            
            <Link
              to="/scores"
              className={getNavLinkClasses('/scores')}
            >
              Scores
            </Link>
            
            <Link
              to="/foursomes"
              className={getNavLinkClasses('/foursomes')}
            >
              Foursomes
            </Link>
            
            <Link
              to="/gallery"
              className={getNavLinkClasses('/gallery')}
            >
              Gallery
            </Link>
            
            <Link
              to="/champions"
              className={getNavLinkClasses('/champions')}
            >
              Champions
            </Link>
            
            {user.isAdmin && (
              <Link
                to="/users"
                className={getNavLinkClasses('/users')}
              >
                Users
              </Link>
            )}
            
            <div className="relative group">
              <button className="flex items-center space-x-2 text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                <Avatar src={user.avatar} alt={user.name} name={user.name} size="sm" />
                <span>{user.name}</span>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-1">
                  <Link
                    to="/account"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Account Settings
                  </Link>
                  <Link
                    to="/install"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    📱 Install App
                  </Link>
                  <Form method="post" action="/logout">
                    <button
                      type="submit"
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Sign Out
                    </button>
                  </Form>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700 hover:text-green-600 p-2 rounded-md transition-colors"
              aria-label="Toggle mobile menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 pt-4 pb-4">
            <div className="space-y-1">
              <Link
                to="/"
                className={getNavLinkClasses('/', true)}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              
              <Link
                to="/golfers"
                className={getNavLinkClasses('/golfers', true)}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Golfers
              </Link>
              
              <Link
                to="/scores"
                className={getNavLinkClasses('/scores', true)}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Scores
              </Link>
              
              <Link
                to="/foursomes"
                className={getNavLinkClasses('/foursomes', true)}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Foursomes
              </Link>
              
              <Link
                to="/gallery"
                className={getNavLinkClasses('/gallery', true)}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Gallery
              </Link>
              
              <Link
                to="/champions"
                className={getNavLinkClasses('/champions', true)}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Champions
              </Link>
              
              {user.isAdmin && (
                <Link
                  to="/users"
                  className={getNavLinkClasses('/users', true)}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Users
                </Link>
              )}
              
              {/* Mobile User Menu */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex items-center px-3 py-2 mb-2">
                  <Avatar src={user.avatar} alt={user.name} name={user.name} size="sm" />
                  <span className="ml-3 text-gray-900 font-medium">{user.name}</span>
                </div>
                
                <Link
                  to="/account"
                  className="block px-3 py-2 text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-md text-base font-medium transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Account Settings
                </Link>
                
                <Link
                  to="/install"
                  className="block px-3 py-2 text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-md text-base font-medium transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  📱 Install App
                </Link>
                
                <Form method="post" action="/logout">
                  <button
                    type="submit"
                    className="block w-full text-left px-3 py-2 text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-md text-base font-medium transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign Out
                  </button>
                </Form>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}