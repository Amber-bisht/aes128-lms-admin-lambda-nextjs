"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { LogOut, LayoutDashboard } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useAuthUI } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";

export default function Navbar() {
    const { isAuthModalOpen, openAuthModal, closeAuthModal } = useAuthUI();
    const { status } = useSession();
    const isAuthenticated = status === "authenticated";

    return (
        <>
            <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />
            <nav className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/70 backdrop-blur-xl">
                <div className="max-w-[1200px] mx-auto px-6 py-5 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <span className="font-black text-2xl tracking-tighter text-gray-900 italic">
                            lms.<span className="text-blue-600">amberbisht</span>
                        </span>
                    </Link>

                    <div className="flex items-center gap-10">
                        <Link href="#courses" className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors">Courses</Link>
                        {isAuthenticated ? (
                            <div className="flex items-center gap-8">
                                <Link
                                    href="/dashboard"
                                    className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors flex items-center gap-2"
                                >
                                    <LayoutDashboard className="w-4 h-4" />
                                    Dashboard
                                </Link>
                                <button
                                    onClick={() => signOut()}
                                    className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors cursor-pointer flex items-center gap-2"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign Out
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={openAuthModal}
                                className="bg-gray-900 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-gray-200"
                            >
                                Sign In
                            </button>
                        )}
                    </div>
                </div>
            </nav>
        </>
    );
}
