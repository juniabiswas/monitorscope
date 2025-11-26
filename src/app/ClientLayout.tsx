"use client";

import Image from "next/image";
import { useEffect, useState, type ReactNode, useRef } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { useUserRole } from "@/hooks/useUserRole";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function AppHeader({
  isDark,
  toggleDark,
  menuOpen,
  setMenuOpen,
}: {
  isDark?: boolean;
  toggleDark?: () => void;
  menuOpen?: boolean;
  setMenuOpen?: (v: boolean) => void;
}) {
  const [dashOpen, setDashOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const { userRole, loading } = useUserRole();
  const dashTimeout = useRef<NodeJS.Timeout | null>(null);
  const helpTimeout = useRef<NodeJS.Timeout | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleDashEnter() {
    if (dashTimeout.current) clearTimeout(dashTimeout.current);
    setDashOpen(true);
  }
  function handleDashLeave() {
    dashTimeout.current = setTimeout(() => setDashOpen(false), 200);
  }

  function handleHelpEnter() {
    if (helpTimeout.current) clearTimeout(helpTimeout.current);
    setHelpOpen(true);
  }
  function handleHelpLeave() {
    helpTimeout.current = setTimeout(() => setHelpOpen(false), 200);
  }

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-900 shadow-md">
      <div className="flex items-center gap-3">
        <Image src="/logo.png" alt="MonitorScope Logo" width={48} height={48} />
        <span className="text-2xl font-bold tracking-tight text-primary">
          MonitorScope
        </span>
        <nav className="ml-8 flex gap-6 text-secondary relative">
          <a href="/" className="hover:text-accent">
            My Page
          </a>
          {/* Dashboards Dropdown */}
          <div
            className="relative"
            onMouseEnter={handleDashEnter}
            onMouseLeave={handleDashLeave}
          >
            <button
              className="hover:text-accent flex items-center gap-1 focus:outline-none"
              onClick={() => setDashOpen((v) => !v)}
              type="button"
            >
              Dashboards
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {mounted && dashOpen && (
              <div
                className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded shadow-lg z-50"
                onMouseEnter={handleDashEnter}
                onMouseLeave={handleDashLeave}
              >
                <a
                  href="/health-checks"
                  className="block px-4 py-2 text-secondary dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-800 transition-colors rounded-t"
                >
                  Health Checks
                </a>
                {/* Add more dashboard links here if needed */}
              </div>
            )}
          </div>
          <a href="/apis" className="hover:text-accent">
            APIs
          </a>
          <a href="/alerts" className="hover:text-accent">
            Alerts
          </a>
          <a href="/users" className="hover:text-accent">
            Users
          </a>
          {/* Help Dropdown */}
          <div className="relative" onMouseEnter={handleHelpEnter} onMouseLeave={handleHelpLeave}>
            <button
              className="hover:text-accent flex items-center gap-1 focus:outline-none"
              onClick={() => setHelpOpen((v) => !v)}
              type="button"
            >
              Help
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {mounted && helpOpen && (
              <div
                className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded shadow-lg z-50"
                onMouseEnter={handleHelpEnter}
                onMouseLeave={handleHelpLeave}
              >
                <a
                  href="/faq"
                  className="block px-4 py-2 text-secondary dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-800 transition-colors rounded-t"
                >
                  FAQ
                </a>
                {/* Add more help links here if needed */}
              </div>
            )}
          </div>
        </nav>
      </div>
      {/* User Hamburger Menu */}
      <div className="relative">
        <button
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
          onClick={() => setMenuOpen && setMenuOpen(!(menuOpen ?? false))}
        >
          <span className="sr-only">Open user menu</span>
          <svg
            className="w-6 h-6 text-secondary"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded shadow-lg py-2 z-50">
            <button
              className="w-full text-left px-4 py-2 text-secondary dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 transition-colors"
              onClick={() => {
                toggleDark && toggleDark();
                setMenuOpen && setMenuOpen(false);
              }}
            >
              <svg
                className="w-5 h-5 text-accent dark:text-accent"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3v1m0 16v1m8.66-8.66l-.71.71M4.05 4.05l-.71.71M21 12h-1M4 12H3m16.95 7.95l-.71-.71M7.05 19.95l-.71-.71M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              {isDark ? "Light Mode" : "Dark Mode"}
            </button>
            <a
              href="/profile"
              className="block w-full text-left px-4 py-2 text-secondary dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setMenuOpen && setMenuOpen(false)}
            >
              My Profile
            </a>
            <a
              href="/alerts"
              className="block w-full text-left px-4 py-2 text-secondary dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setMenuOpen && setMenuOpen(false)}
            >
              Alerts
            </a>
            {userRole && (userRole.trim() === 'SuperAdmin' || userRole.trim() === 'Admin') && (
              <a
                href="/email-settings"
                className="block w-full text-left px-4 py-2 text-secondary dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => setMenuOpen && setMenuOpen(false)}
              >
                Email Settings
              </a>
            )}
            {/* Debug logging */}
            {console.log('🔍 ClientLayout - userRole:', userRole, 'loading:', loading, 'canAccess:', userRole && (userRole.trim() === 'SuperAdmin' || userRole.trim() === 'Admin'))}
            <button
              className="w-full text-left px-4 py-2 text-secondary dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => {
                fetch('/api/logout', { method: 'POST' }).then(() => {
                  window.location.href = '/login';
                });
                setMenuOpen && setMenuOpen(false);
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

function AppFooter() {
  return (
    <footer className="w-full py-4 px-6 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 text-center text-gray-500 text-sm">
      &copy; {new Date().getFullYear()} MonitorScope. All rights reserved.
    </footer>
  );
}

export default function ClientLayout({ children }: { children: ReactNode }) {
  // Dark mode state for the header menu
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (saved === "dark" || (!saved && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDark(false);
      document.documentElement.classList.remove("dark");
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (typeof window === "undefined") return;
    localStorage.setItem("theme", isDark ? "dark" : "light");
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark, mounted]);

  const toggleDark = () => setIsDark((prev) => !prev);

  return (
    <div
      className={`theme-root min-h-screen flex flex-col ${
        isDark ? "theme-dark" : ""
      }`}
    >
      <AppHeader
        isDark={isDark}
        toggleDark={toggleDark}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />
      <main className="flex-1">{children}</main>
      <AppFooter />
    </div>
  );
}
