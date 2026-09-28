import type { AppProps } from 'next/app';
import Head from 'next/head';
import { ThemeProvider } from '@/contexts/ThemeContext';
import '@/styles/globals.css';
// Chart/tooltip CSS custom properties (--chart-*, --tooltip-*, --series-*) —
// plain global CSS, so it must load here like globals.css.
import '@/components/EcosystemStats/EcosystemStats.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name='viewport' content='width=device-width, initial-scale=1, maximum-scale=5' />
      </Head>
      <ThemeProvider>
        <Component {...pageProps} />
      </ThemeProvider>
    </>
  );
}

export default MyApp;
