import React from 'react';
import './globals.css';

export const metadata = {
  title: 'Nexus DevOps Suite - Live In-Memory Patcher',
  description: 'Zero-downtime bytecode hot-swapping for production enterprise server systems.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#0b0c10', color: '#c5c6c7' }}>
        {children}
      </body>
    </html>
  );
}
