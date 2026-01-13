import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en" className="scroll-smooth">
      <Head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.github.com" />
        <link rel="preconnect" href="https://github.com" />

        {/* DNS prefetch for potential external resources */}
        <link rel="dns-prefetch" href="https://raw.githubusercontent.com" />
        <link rel="dns-prefetch" href="https://user-images.githubusercontent.com" />

        {/* Meta tags */}
        <meta charSet="utf-8" />
          <meta name="theme-color" content="#2563eb" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Claude Marketplace" />
        <meta name="application-name" content="Claude Marketplace" />
        <meta name="referrer" content="origin-when-cross-origin" />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />

        {/* Content Security Policy */}
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: http:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://api.github.com https://raw.githubusercontent.com; frame-src 'none'; base-uri 'self'; form-action 'self';"
        />

        {/* Additional Security Headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta httpEquiv="Strict-Transport-Security" content="max-age=31536000; includeSubDomains" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
        <meta httpEquiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=()" />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://claude-marketplace.github.io/aggregator/" />
        <meta property="og:title" content="Claude Marketplace Aggregator" />
        <meta property="og:description" content="Discover and explore Claude Code plugins and marketplaces from across GitHub. An automated, open-source aggregator." />
        <meta property="og:image" content="/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Claude Marketplace Aggregator - Discover Claude Code Plugins" />
        <meta property="og:site_name" content="Claude Marketplace Aggregator" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://claude-marketplace.github.io/aggregator/" />
        <meta property="twitter:title" content="Claude Marketplace Aggregator" />
        <meta property="twitter:description" content="Discover and explore Claude Code plugins and marketplaces from across GitHub. An automated, open-source aggregator." />
        <meta property="twitter:image" content="/og-image.png" />
        <meta property="twitter:image:alt" content="Claude Marketplace Aggregator - Discover Claude Code Plugins" />
        <meta property="twitter:creator" content="@claude" />
        <meta property="twitter:site" content="@claude" />

        {/* Additional SEO meta tags */}
        <meta name="description" content="Discover and explore Claude Code plugins and marketplaces from across GitHub. An automated, open-source aggregator to enhance your development workflow." />
        <meta name="keywords" content="Claude, Claude Code, marketplace, plugins, aggregator, GitHub, development tools, AI, automation" />
        <meta name="author" content="Claude Marketplace Contributors" />
        <link rel="canonical" href="https://claude-marketplace.github.io/aggregator/" />

        {/* Structured Data */}
        {/* Temporarily commented out for debugging */}
        {/*
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Claude Marketplace Aggregator",
              "description": "Discover and explore Claude Code plugins and marketplaces from across GitHub. An automated, open-source aggregator.",
              "url": "https://claude-marketplace.github.io/aggregator/",
              "applicationCategory": "DeveloperApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "author": {
                "@type": "Organization",
                "name": "Claude Marketplace Contributors"
              }
            })
          }}
        />
        */}

        {/* Google Fonts with display=swap for performance */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />

        
        {/* Preload key images */}
        <link rel="preload" href="/og-image.png" as="image" />
      </Head>
      <body className="antialiased bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}