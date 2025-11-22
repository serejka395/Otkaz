/* eslint-disable @next/next/no-page-custom-font */
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'Enough - Gamified Savings PWA',
  description: 'Track your savings, earn achievements, and see crypto ROI',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Enough',
  },
};

export const viewport: Viewport = {
  themeColor: '#F5C61A',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        
        {/* Professional Font - Inter */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen" style={{ background: '#F5F5F7' }}>
        {children}
        <Toaster 
          position="top-center"
          toastOptions={{
            style: {
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              color: '#1D1D1F',
              fontWeight: '500',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '12px',
              padding: '1rem 1.5rem',
              fontSize: '0.875rem',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(0, 0, 0, 0.06)',
              fontFamily: '-apple-system, BlinkMacSystemFont, Inter, sans-serif',
            },
            success: {
              iconTheme: {
                primary: '#F5C61A',
                secondary: '#FFFFFF',
              },
            },
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (!('serviceWorker' in navigator)) return;
                window.addEventListener('load', async () => {
                  try {
                    const regs = await navigator.serviceWorker.getRegistrations();
                    // Unregister any third-party SWs that aren't our own '/sw.js'
                    await Promise.all(
                      regs
                        .filter(r => r?.active && r.active.scriptURL && !r.active.scriptURL.endsWith('/sw.js'))
                        .map(r => r.unregister().catch(() => {}))
                    );
                    // Register our SW
                    await navigator.serviceWorker.register('/sw.js', { scope: '/' });
                  } catch (e) {
                    // noop
                  }
                });
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
