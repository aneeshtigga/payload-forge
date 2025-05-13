
import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Changed from Geist to Inter
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Flame } from 'lucide-react';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Payload Forge - JSON Job Configurator',
  description: 'Easily generate and customize JSON payloads for your Spark jobs with Payload Forge.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <div className="flex flex-col min-h-screen">
          <header className="text-primary-foreground sticky top-0 z-50 shadow-md" style={{ backgroundColor: '#f8f9fa' }}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
              <Flame className="text-blue-800 fill-blue-500 h-8 w-8 mr-3" />
              <h1 className="text-blue-800 text-2xl font-bold tracking-tight">Payload Forge</h1>
            </div>
          </header>
          <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <footer className="bg-muted text-muted-foreground py-6 text-center text-sm">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              Made with ❤️ by Aneesh Tigga
            </div>
          </footer>
        </div>
        <Toaster />
      </body>
    </html>
  );
}

