import { Link, Form } from 'react-router';
import { Avatar, Logo } from './ui';
import type { User } from '../lib/auth';

interface NavigationProps {
  user: User;
}

export function Navigation({ user }: NavigationProps) {
  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Logo size="sm" />
              <span className="text-xl font-bold text-gray-900">Scaletta Golf</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Home
            </Link>
            
            <Link
              to="/golfers"
              className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Golfers
            </Link>
            
            <Link
              to="/foursomes"
              className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Foursomes
            </Link>
            
            <Link
              to="/gallery"
              className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Gallery
            </Link>
            
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
        </div>
      </div>
    </nav>
  );
}