import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Chronicle // Revision Workspace',
  description: 'Professional digital intermediate continuity ledger, bounded 3-hop ripple analysis, and real-time revision simulator for agentic cinema.',
  openGraph: {
    title: 'Chronicle // Revision Workspace',
    description: 'Professional digital intermediate continuity ledger, bounded 3-hop ripple analysis, and real-time revision simulator for agentic cinema.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chronicle // Revision Workspace',
    description: 'Professional digital intermediate continuity ledger, bounded 3-hop ripple analysis, and real-time revision simulator for agentic cinema.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400;1,6..72,500&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning className="bg-[#0c0e11] text-[#e2e2e6] select-none antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}
