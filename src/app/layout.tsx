import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MIVA Open University - Maintenance & Service Portal',
  description: 'Submit, track, and manage university maintenance and service requests digitally.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
