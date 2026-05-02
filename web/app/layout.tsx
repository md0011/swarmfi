import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SwarmFi — AI Agent DeFi Swarm',
  description: '4 AI agents trading DeFi autonomously via Gensyn AXL, 0G Storage & KeeperHub',
  icons: [
    { rel: 'icon', url: '/favicon.svg', type: 'image/svg+xml' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml"/>
      </head>
      <body style={{ margin: 0, background: '#050508' }} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
