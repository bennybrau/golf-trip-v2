import { useEffect, useRef, useState } from 'react';
import { Link, Form, useLocation } from 'react-router';
import { Avatar, Logo } from './ui';
import { cn } from '../lib/cn';
import type { User } from '../lib/auth';

interface NavigationProps {
  user: User;
}

interface NavItem {
  to: string;
  label: string;
  adminOnly?: boolean;
}

/**
 * Single source of truth for the primary nav.
 *
 * The desktop and mobile menus previously each spelled out the full link list,
 * so every nav change meant two edits kept in sync by hand -- and they had
 * already drifted.
 */
const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'Home' },
  { to: '/golfers', label: 'Golfers' },
  { to: '/scores', label: 'Scores' },
  { to: '/foursomes', label: 'Foursomes' },
  { to: '/course', label: 'Course' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/champions', label: 'Champions' },
  { to: '/users', label: 'Users', adminOnly: true },
  { to: '/admin/season', label: 'Season', adminOnly: true },
];

export function Navigation({ user }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const userMenuRef = useRef<HTMLDivElement>(null);

  const items = NAV_ITEMS.filter((item) => !item.adminOnly || user.isAdmin);

  // Close both menus on navigation. This replaces eight duplicated per-link
  // onClick handlers, and also covers browser back/forward, which those missed.
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  // The user menu was hover-only (`group-hover:opacity-100`) with no click
  // handler, no aria-expanded and no keyboard path -- unreachable by keyboard
  // and only reachable by accidental tap-hold on a touch laptop.
  useEffect(() => {
    if (!isUserMenuOpen) return;

    function onPointerDown(event: MouseEvent | TouchEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsUserMenuOpen(false);
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isUserMenuOpen]);

  // Lock background scroll and allow Escape to dismiss the mobile drawer.
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsMobileMenuOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isMobileMenuOpen]);

  function isActive(path: string) {
    return path === '/'
      ? location.pathname === '/'
      : location.pathname === path || location.pathname.startsWith(`${path}/`);
  }

  function navLinkClasses(path: string, mobile = false) {
    const active = isActive(path);
    return cn(
      'rounded-control font-medium transition-colors',
      mobile ? 'block px-3 py-3 text-base min-h-11' : 'px-3 py-2 text-sm',
      active
        ? 'bg-brand-100 text-brand-800'
        : cn('text-gray-700 hover:text-brand-700', mobile && 'hover:bg-gray-50')
    );
  }

  return (
    <nav className="bg-white shadow-card border-b border-gray-200 sticky top-0 z-40 pt-safe">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-2">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <Logo size="sm" />
            {/* Truncates rather than colliding with the hamburger at 390px. */}
            <span className="text-lg sm:text-xl font-bold text-gray-900 truncate">
              Scaletta Golf Trip
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={navLinkClasses(item.to)}
                aria-current={isActive(item.to) ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ))}

            <div className="relative ml-1" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((open) => !open)}
                aria-expanded={isUserMenuOpen}
                aria-haspopup="menu"
                aria-controls="user-menu"
                className="flex items-center gap-2 text-gray-700 hover:text-brand-700 px-3 py-2 rounded-control text-sm font-medium transition-colors"
              >
                <Avatar src={user.avatar} alt={user.name} name={user.name} size="sm" />
                <span className="max-w-32 truncate">{user.name}</span>
                <svg
                  className={cn('h-4 w-4 transition-transform', isUserMenuOpen && 'rotate-180')}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isUserMenuOpen && (
                <div
                  id="user-menu"
                  role="menu"
                  className="absolute right-0 mt-2 w-48 bg-white rounded-card shadow-overlay border border-gray-200 py-1 z-50"
                >
                  <Link
                    to="/account"
                    role="menuitem"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Account Settings
                  </Link>
                  <Link
                    to="/install"
                    role="menuitem"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    📱 Install App
                  </Link>
                  <Form method="post" action="/logout">
                    <button
                      type="submit"
                      role="menuitem"
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign Out
                    </button>
                  </Form>
                </div>
              )}
            </div>
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            className="md:hidden text-gray-700 hover:text-brand-700 p-2 -mr-2 rounded-control transition-colors min-h-11 min-w-11 flex items-center justify-center"
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={isMobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
              />
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div id="mobile-menu" className="md:hidden border-t border-gray-200 py-3 pb-safe">
            <div className="space-y-1">
              {items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={navLinkClasses(item.to, true)}
                  aria-current={isActive(item.to) ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-3 mt-3">
              <div className="flex items-center px-3 py-2 mb-1">
                <Avatar src={user.avatar} alt={user.name} name={user.name} size="sm" />
                <span className="ml-3 text-gray-900 font-medium truncate">{user.name}</span>
              </div>
              <Link to="/account" className={navLinkClasses('/account', true)}>
                Account Settings
              </Link>
              <Link to="/install" className={navLinkClasses('/install', true)}>
                📱 Install App
              </Link>
              <Form method="post" action="/logout">
                <button
                  type="submit"
                  className="block w-full text-left px-3 py-3 min-h-11 rounded-control text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Sign Out
                </button>
              </Form>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
