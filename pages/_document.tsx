import { Html, Head, Main, NextScript } from 'next/document';

const SITE_URL = 'https://shrwnsan.github.io/claude-marketplace-registry';
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

/** Runs before first paint so the `dark` class is already on <html> — no theme flash. */
const themeInitScript = `(function(){try{var s=localStorage.getItem('claude-marketplace-theme');var t=s==='dark'||s==='light'?s:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.classList.add(t);}catch(e){}})();`;

export default function Document() {
  return (
    <Html lang='en' className='scroll-smooth' suppressHydrationWarning>
      <Head>
        {/* Set the theme class before anything renders — see ThemeContext */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />

        {/* Preconnect to external domains for performance */}
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='anonymous' />
        <link rel='preconnect' href='https://api.github.com' />
        <link rel='preconnect' href='https://github.com' />

        {/* DNS prefetch for potential external resources */}
        <link rel='dns-prefetch' href='https://raw.githubusercontent.com' />
        <link rel='dns-prefetch' href='https://user-images.githubusercontent.com' />

        {/* Meta tags */}
        <meta charSet='utf-8' />
        <meta name='theme-color' content='#faf9f7' media='(prefers-color-scheme: light)' />
        <meta name='theme-color' content='#161310' media='(prefers-color-scheme: dark)' />
        <meta name='apple-mobile-web-app-capable' content='yes' />
        <meta name='apple-mobile-web-app-status-bar-style' content='default' />
        <meta name='apple-mobile-web-app-title' content='Claude Marketplace' />
        <meta name='application-name' content='Claude Marketplace' />
        <meta name='referrer' content='origin-when-cross-origin' />
        <meta name='robots' content='index, follow' />
        <meta name='googlebot' content='index, follow' />

        {/* Content Security Policy */}
        <meta
          httpEquiv='Content-Security-Policy'
          content="default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: http:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://api.github.com https://raw.githubusercontent.com; frame-src 'none'; base-uri 'self'; form-action 'self';"
        />

        {/* Additional Security Headers */}
        <meta httpEquiv='X-Content-Type-Options' content='nosniff' />
        <meta httpEquiv='X-Frame-Options' content='DENY' />
        <meta httpEquiv='X-XSS-Protection' content='1; mode=block' />
        <meta httpEquiv='Strict-Transport-Security' content='max-age=31536000; includeSubDomains' />
        <meta httpEquiv='Referrer-Policy' content='strict-origin-when-cross-origin' />
        <meta httpEquiv='Permissions-Policy' content='camera=(), microphone=(), geolocation=()' />

        {/* Favicon */}
        <link rel='icon' href={`${BASE_PATH}/favicon.ico`} />
        <link rel='icon' type='image/png' sizes='32x32' href={`${BASE_PATH}/favicon-32x32.png`} />
        <link rel='icon' type='image/png' sizes='16x16' href={`${BASE_PATH}/favicon-16x16.png`} />
        <link rel='apple-touch-icon' sizes='180x180' href={`${BASE_PATH}/apple-touch-icon.png`} />
        <link rel='manifest' href={`${BASE_PATH}/manifest.json`} />

        {/* Open Graph / Facebook */}
        <meta property='og:type' content='website' />
        <meta property='og:url' content={`${SITE_URL}/`} />
        <meta property='og:title' content='Claude Marketplace Registry' />
        <meta
          property='og:description'
          content='Discover and explore Claude Code plugins and marketplaces from across GitHub. An automated, open-source aggregator.'
        />
        <meta property='og:image' content={`${SITE_URL}${BASE_PATH}/og-image.png`} />
        <meta property='og:image:width' content='1200' />
        <meta property='og:image:height' content='630' />
        <meta
          property='og:image:alt'
          content='Claude Marketplace Registry — discover Claude Code plugins and marketplaces'
        />
        <meta property='og:site_name' content='Claude Marketplace Registry' />

        {/* Twitter */}
        <meta property='twitter:card' content='summary_large_image' />
        <meta property='twitter:url' content={`${SITE_URL}/`} />
        <meta property='twitter:title' content='Claude Marketplace Registry' />
        <meta
          property='twitter:description'
          content='Discover and explore Claude Code plugins and marketplaces from across GitHub. An automated, open-source aggregator.'
        />
        <meta property='twitter:image' content={`${SITE_URL}${BASE_PATH}/og-image.png`} />
        <meta
          property='twitter:image:alt'
          content='Claude Marketplace Registry — discover Claude Code plugins and marketplaces'
        />

        {/* Additional SEO meta tags */}
        <meta
          name='description'
          content='Discover and explore Claude Code plugins and marketplaces from across GitHub. An automated, open-source aggregator to enhance your development workflow.'
        />
        <meta
          name='keywords'
          content='Claude, Claude Code, marketplace, plugins, aggregator, GitHub, development tools, AI, automation'
        />
        <meta name='author' content='Claude Marketplace Contributors' />
        <link rel='canonical' href={`${SITE_URL}/`} />

        {/* Brand fonts — display / mono voice / reading sans, one request */}
        <link
          href='https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300..800&family=Instrument+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap'
          rel='stylesheet'
        />
      </Head>
      <body className='antialiased bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100'>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
