"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Header() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const controlHeader = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", controlHeader);
    return () => {
      window.removeEventListener("scroll", controlHeader);
    };
  }, [lastScrollY]);

  return (
    <header
      className={`fixed top-0 left-0 w-full bg-background text-foreground shadow-md z-50 flex items-center justify-between px-4 py-2 transition-transform duration-300 ease-in-out ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      {/* Logo - Clickable to navigate to home */}
      <Link href="/" className="flex items-center">
        <Image
          src="/aganitha-logo.png"
          alt="Aganitha Logo"
          width={120}
          height={120}
          style={{ objectFit: "contain" }}
        />
      </Link>
      {/* Centered Content */}
      <div className="flex flex-col items-center">
        <h1 className="text-xl font-bold text-primary">Agandock</h1>
        <p className="text-sm text-muted-foreground">
          Docking and binding free energy calculations
        </p>
      </div>
      <div className="w-[120px]"></div>
    </header>
  );
}
