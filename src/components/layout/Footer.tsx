import React from 'react';
import Link from 'next/link';
import { Github, Twitter, Mail, Heart } from 'lucide-react';

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: 'Features', href: '/features' },
      { name: 'Marketplaces', href: '/marketplaces' },
      { name: 'Plugins', href: '/plugins' },
      { name: 'Pricing', href: '/pricing' },
    ],
    resources: [
      { name: 'Documentation', href: '/docs' },
      { name: 'API Reference', href: '/api' },
      { name: 'Blog', href: '/blog' },
      { name: 'Community', href: '/community' },
    ],
    company: [
      { name: 'About', href: '/about' },
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Contact', href: '/contact' },
    ],
  };

  const socialLinks = [
    { name: 'GitHub', href: 'https://github.com/claude-marketplace/aggregator', icon: Github },
    { name: 'Twitter', href: 'https://twitter.com/claude_market', icon: Twitter },
    { name: 'Email', href: 'mailto:hello@claude-marketplace.com', icon: Mail },
  ];

  return (
    <footer className={`bg-gray-900 dark:bg-gray-950 text-white ${className}`} role='contentinfo'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16'>
        {/* Main footer content */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-12'>
          {/* Brand section */}
          <div className='lg:col-span-2'>
            <div className='flex items-center space-x-3 mb-6'>
              <div className='w-10 h-10 bg-primary-600 dark:bg-primary-500 rounded-xl flex items-center justify-center transform hover:scale-110 transition-transform'>
                <span className='text-white font-bold text-xl'>C</span>
              </div>
              <span className='text-xl font-bold'>Claude Marketplace</span>
            </div>
            <p className='text-gray-300 dark:text-gray-400 mb-6 max-w-md leading-relaxed'>
              An automated, open-source aggregator that discovers and curates Claude Code
              marketplaces and plugins from across GitHub. Enhance your development workflow with
              the best tools.
            </p>
            <nav aria-label='Social media links'>
              <div className='flex space-x-4'>
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.name}
                      href={social.href}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-gray-400 dark:text-gray-500 hover:text-primary-400 dark:hover:text-primary-300 transition-colors p-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900 group'
                      aria-label={`Follow us on ${social.name} (opens in new tab)`}
                    >
                      <Icon className='w-5 h-5 transform group-hover:scale-110 transition-transform' />
                    </a>
                  );
                })}
              </div>
            </nav>
          </div>

          {/* Links sections */}
          <div>
            <h3 className='font-semibold text-white mb-4 text-lg'>Product</h3>
            <ul className='space-y-3' role='list'>
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className='text-gray-300 dark:text-gray-400 hover:text-primary-400 dark:hover:text-primary-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded'
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className='font-semibold text-white mb-4 text-lg'>Resources</h3>
            <ul className='space-y-3' role='list'>
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className='text-gray-300 dark:text-gray-400 hover:text-primary-400 dark:hover:text-primary-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded'
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className='font-semibold text-white mb-4 text-lg'>Company</h3>
            <ul className='space-y-3' role='list'>
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className='text-gray-300 dark:text-gray-400 hover:text-primary-400 dark:hover:text-primary-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded'
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className='border-t border-gray-800 dark:border-gray-700 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4'>
          <p className='text-gray-400 dark:text-gray-500 text-sm text-center sm:text-left'>
            © {currentYear} Claude Marketplace Aggregator. All rights reserved.
          </p>
          <div className='flex items-center text-sm text-gray-400 dark:text-gray-500'>
            <span>Made with</span>
            <Heart className='w-4 h-4 mx-1 text-red-500 animate-pulse' aria-hidden='true' />
            <span>by the community</span>
          </div>
        </div>

        {/* Accessibility statement */}
        <div className='mt-8 pt-8 border-t border-gray-800 dark:border-gray-700 text-center'>
          <p className='text-xs text-gray-500 dark:text-gray-600'>
            This website is committed to digital accessibility and WCAG 2.1 AA compliance.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
