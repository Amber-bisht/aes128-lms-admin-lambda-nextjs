"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { signIn } from "next-auth/react";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[100]"
                    />

                    {/* Modal Container */}
                    <div className="fixed inset-0 flex items-center justify-center z-[110] p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-md bg-white rounded-[3rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] pointer-events-auto relative border border-gray-100"
                        >
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-8 right-8 p-2 rounded-full hover:bg-gray-50 text-gray-300 hover:text-gray-600 transition-all z-20"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="p-12 pt-16">
                                <div className="mb-10">
                                    <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest mb-6">
                                        Invite-only access
                                    </div>
                                    <h2 className="text-4xl font-black mb-4 tracking-tight text-gray-900">CRM sign in</h2>
                                    <p className="text-gray-500 font-medium text-sm leading-relaxed max-w-[320px]">
                                        Use your approved Google account to open the CRM.
                                        Access is granted only to staff emails that already exist in the system.
                                    </p>
                                </div>

                                <div className="space-y-8">
                                    <button
                                        onClick={() => signIn("google", { callbackUrl: window.location.href })}
                                        className="w-full h-14 bg-[#2563eb] text-white rounded-xl font-bold flex items-center justify-center gap-4 hover:bg-blue-700 transition-all transform active:scale-[0.98] shadow-lg shadow-blue-500/20"
                                    >
                                        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                                            <svg className="w-4 h-4 text-[#2563eb]" viewBox="0 0 24 24">
                                                <path
                                                    fill="currentColor"
                                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                />
                                                <path
                                                    fill="currentColor"
                                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                />
                                                <path
                                                    fill="currentColor"
                                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                                />
                                                <path
                                                    fill="currentColor"
                                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                                />
                                            </svg>
                                        </div>
                                        Continue with Google
                                    </button>

                                    <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100/50">
                                        <p className="text-[13px] text-amber-900/80 leading-relaxed font-medium">
                                            If your Google account is correct but access is denied,
                                            an Admin still needs to add your email to the CRM
                                            team list first.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
