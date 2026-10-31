import './globals.css';
import { ToastProvider } from '@/components/Toast';
import PWA from '@/components/PWA';

export const metadata = {
  title: 'Techyverve CRM',
  description: 'Hotel lead tracking, camps and hishob for Techyverve',
  manifest: '/manifest.webmanifest',
  applicationName: 'Techyverve',
  appleWebApp: { capable: true, title: 'Techyverve', statusBarStyle: 'black-translucent' },
  icons: { icon: '/icons/icon-192.png', apple: '/icons/apple-touch-icon.png' },
  formatDetection: { telephone: false },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#04123f',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ToastProvider>{children}</ToastProvider>
        <PWA />
      </body>
    </html>
  );
}
