'use client';

import Image from 'next/image';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-md text-gray-800 dark:text-gray-100 border-b border-gray-200 shadow-lg z-50 flex items-center justify-between px-6 py-4 h-16">
      <div className="flex items-center">
        <Image
          src="https://www.aganitha.ai/wp-content/uploads/2023/05/aganitha-logo.png"
          alt="Aganitha Logo"
          width={120}
          height={40}
          style={{ objectFit: 'contain' }}
        />
      </div>
      <div className="flex flex-col items-center">
        <h1 className="text-xl font-bold text-gray-700 dark:text-gray-100">Property Modelling</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          GenAI powered molecule optimization
        </p>
      </div>
      <div className="w-12"></div>
    </header>
  );
}