import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, Menu, X, Github, Star } from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle';

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className = '' }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const navigation = [
    { name: 'Home', href: '/', current: false },
    { name: 'Marketplaces', href: '/marketplaces', current: false },
    { name: 'Plugins', href: '/plugins', current: false },
    { name: 'Documentation', href: '/docs', current: false },
  ];

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current?.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
        buttonRef.current?.focus();
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  // Handle navigation item click
  const handleNavClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <header
      className={`bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 transition-colors ${className}`}
    >
      <nav
        className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'
        role='navigation'
        aria-label='Main navigation'
      >
        <div className='flex justify-between items-center h-16'>
          {/* Logo */}
          <div className='flex items-center'>
            <Link
              href='/'
              className='flex items-center space-x-3 group'
              aria-label='Claude Marketplace Aggregator home'
            >
              <div className='w-10 h-10 bg-primary-600 dark:bg-primary-500 rounded-xl flex items-center justify-center transform transition-transform group-hover:scale-110'>
                <span className='text-white font-bold text-xl'>C</span>
              </div>
              <span className='text-xl font-bold text-gray-900 dark:text-gray-100 hidden sm:block transition-colors group-hover:text-primary-600 dark:group-hover:text-primary-400'>
                Claude Marketplace
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className='hidden lg:flex items-center space-x-1'>
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className='nav-link'
                aria-label={`Navigate to ${item.name}`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right side actions */}
          <div className='flex items-center space-x-2 sm:space-x-4'>
            {/* Theme Toggle */}
            <ThemeToggle variant='dropdown' />

            {/* Search button */}
            <button
              className='btn-ghost p-2'
              aria-label='Search'
              onClick={() => {
                // Focus search input on page
                const searchInput = document.getElementById('search') as HTMLInputElement;
                searchInput?.focus();
              }}
            >
              <Search className='w-5 h-5' />
            </button>

            {/* GitHub button */}
            <a
              href='https://github.com/shrwnsan/claude-marketplace-registry'
              target='_blank'
              rel='noopener noreferrer'
              className='hidden sm:flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all group'
              aria-label='View on GitHub'
            >
              <Github className='w-5 h-5 group-hover:scale-110 transition-transform' />
              <Star className='w-4 h-4 group-hover:fill-current transition-all' />
              <span className='text-sm font-medium'>Star</span>
            </a>

            {/* Mobile menu button */}
            <button
              ref={buttonRef}
              className='lg:hidden btn-ghost p-2'
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label='Toggle menu'
              aria-expanded={isMenuOpen}
            >
              <div className='relative w-6 h-6'>
                <div
                  className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isMenuOpen ? 'opacity-0 rotate-90' : 'opacity-100 rotate-0'}`}
                >
                  <Menu className='w-6 h-6' />
                </div>
                <div
                  className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isMenuOpen ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'}`}
                >
                  <X className='w-6 h-6' />
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          ref={menuRef}
          className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className='border-t border-gray-200 dark:border-gray-700 py-4'>
            <nav
              className='flex flex-col space-y-1'
              role='navigation'
              aria-label='Mobile navigation'
            >
              {navigation.map((item, index) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className='nav-link block px-4 py-3 rounded-lg text-base font-medium'
                  onClick={handleNavClick}
                  aria-label={`Navigate to ${item.name}`}
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  {item.name}
                </Link>
              ))}

              <div className='border-t border-gray-200 dark:border-gray-600 my-2 pt-2'>
                <a
                  href='https://github.com/shrwnsan/claude-marketplace-registry'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='flex items-center space-x-3 px-4 py-3 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all'
                  aria-label='View on GitHub'
                >
                  <Github className='w-5 h-5' />
                  <span className='font-medium'>View on GitHub</span>
                </a>
              </div>
            </nav>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
