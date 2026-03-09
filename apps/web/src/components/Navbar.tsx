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
            <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/20 backdrop-blur-xl">
                <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <span className="font-bold text-xl tracking-tighter text-white">
                            lms.<span className="text-gray-400">amberbisht</span>
                        </span>
                    </Link>

                    <div className="flex items-center gap-8">
                        <Link href="#courses" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Courses</Link>
                        {isAuthenticated ? (
                            <div className="flex items-center gap-6">
                                <Link
                                    href="/dashboard"
                                    className="text-sm font-medium text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                                >
                                    <LayoutDashboard className="w-4 h-4" />
                                    Dashboard
                                </Link>
                                <button
                                    onClick={() => signOut()}
                                    className="text-sm font-medium text-gray-400 hover:text-white transition-colors cursor-pointer flex items-center gap-2"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign Out
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={openAuthModal}
                                className="text-sm font-medium text-gray-400 hover:text-white transition-colors cursor-pointer"
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
