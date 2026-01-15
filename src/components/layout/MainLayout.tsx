import React from 'react';
import Header from './Header';
import Footer from './Footer';

interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  headerClassName?: string;
  footerClassName?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  className = '',
  showHeader = true,
  showFooter = true,
  headerClassName = '',
  footerClassName = '',
}) => {
  return (
    <div className={`min-h-screen flex flex-col ${className}`}>
      {showHeader && <Header className={headerClassName} />}

      {/* Skip to main content link for accessibility */}
      <a
        href='#main-content'
        className='sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-600 text-white px-4 py-2 rounded-md z-50'
      >
        Skip to main content
      </a>

      {/* Main content area */}
      <main id='main-content' className='flex-grow' role='main'>
        {children}
      </main>

      {showFooter && <Footer className={footerClassName} />}
    </div>
  );
};

export default MainLayout;
