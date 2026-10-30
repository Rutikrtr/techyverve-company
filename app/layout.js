import './globals.css';
import { ToastProvider } from '@/components/Toast';

export const metadata = {
  title: 'Techyverve CRM',
  description: 'Hotel lead tracking, camps and hishob for Techyverve',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
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
      </body>
    </html>
  );
}
