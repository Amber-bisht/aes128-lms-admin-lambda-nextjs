"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, LayoutDashboard, Menu as MenuIcon, X } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useAuthUI } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";

export default function Navbar() {
    const { isAuthModalOpen, openAuthModal, closeAuthModal } = useAuthUI();
    const { status } = useSession();
    const isAuthenticated = status === "authenticated";
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const NavLinks = () => (
        <>
            <Link href="/courses" onClick={() => setIsMenuOpen(false)} className="text-[11px] font-bold uppercase tracking-widest text-gray-500 hover:text-gray-900 transition-colors">Courses</Link>
            <a 
                href="https://github.com/Amber-bisht/aes128-lms-admin-lambda-nextjs" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[11px] font-bold uppercase tracking-widest text-gray-500 hover:text-gray-900 transition-colors"
                onClick={() => setIsMenuOpen(false)}
            >
                GitHub
            </a>
            {isAuthenticated ? (
                <>
                    <Link
                        href="/dashboard"
                        onClick={() => setIsMenuOpen(false)}
                        className="text-[11px] font-bold uppercase tracking-widest text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-2 group/nav"
                    >
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        Dashboard
                    </Link>
                    <button
                        onClick={() => { signOut(); setIsMenuOpen(false); }}
                        className="text-[11px] font-bold uppercase tracking-widest text-gray-500 hover:text-red-600 transition-colors cursor-pointer flex items-center gap-2 group/nav"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                    </button>
                </>
            ) : (
                <button
                    onClick={() => { openAuthModal(); setIsMenuOpen(false); }}
                    className="bg-gray-900 text-white px-8 py-3 rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-gray-900 transition-all shadow-xl shadow-gray-100"
                >
                    Sign In
                </button>
            )}
        </>
    );

    return (
        <>
            <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />
            <nav className="sticky top-0 z-[100] w-full border-b border-gray-100/50 bg-white/60 backdrop-blur-2xl px-6">
                <div className="max-w-[1240px] mx-auto py-5 flex items-center justify-between">
                    <Link href="/" className="font-bold text-xl tracking-tight text-gray-900 leading-none">
                        lms.<span className="text-amber-500">amberbisht</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-10">
                        <NavLinks />
                    </div>

                    {/* Mobile Hamburger Toggle */}
                    <button 
                        className="md:hidden p-2 text-gray-900"
                        onClick={toggleMenu}
                    >
                        {isMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Navigation Overlay */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                            className="md:hidden absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-xl p-8 pb-12 flex flex-col items-center gap-8"
                        >
                            <NavLinks />
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>
        </>
    );
}
