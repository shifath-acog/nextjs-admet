'use client';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ReactNode } from 'react';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ToastContainer } from 'react-toastify';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Home from './page';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: ReactNode }) {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [modelChoice, setModelChoice] = useState('in vitro (H-CLAT)');

  const handlePredictions = (data: any, model: string) => {
    setPredictions(data.predictions || []);
    setModelChoice(model);
  };

  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex flex-col min-h-screen bg-gray-100 overflow-x-hidden">
          <Header />
          <div className="flex flex-1 pt-16 px-4 sm:px-6 gap-4 sm:gap-6 max-w-[1440px] mx-auto mt-8">
           <aside className="w-[340px] flex-shrink-0 hidden lg:block">
              <Sidebar onPredict={handlePredictions} />
            </aside>
            <main className="flex-1 bg-white/80 backdrop-blur-md border border-gray-200 shadow-lg px-8 py-6 border-gray-300 rounded-lg">
              <Home predictions={predictions} modelChoice={modelChoice} />
            </main>
          </div>

        </div>
        <ToastContainer />
      </body>
    </html>
  );
}
