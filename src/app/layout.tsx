import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HispanUSA AIOS',
  description: 'HispanUSA AI Operating System — Document Follow-Up Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
