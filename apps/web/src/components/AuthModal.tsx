"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Mail } from "lucide-react";
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
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />

                    {/* Modal Container */}
                    <div className="fixed inset-0 flex items-center justify-center z-[110] p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-md bg-[#161616] border border-white/10 rounded-3xl overflow-hidden shadow-2xl pointer-events-auto relative"
                        >
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="p-10 pt-12">
                                <div className="text-center mb-10">
                                    <h2 className="text-3xl font-black mb-3 tracking-tight">Welcome Back</h2>
                                    <p className="text-gray-400 font-medium">
                                        Sign in to your account to continue your learning journey.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <button
                                        onClick={() => signIn("google", { callbackUrl: window.location.href })}
                                        className="w-full h-14 bg-white text-black rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-gray-200 transition-all transform active:scale-[0.98]"
                                    >
                                        <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                                        Continue with Google
                                    </button>

                                    <div className="relative my-8">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-white/5"></div>
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-[#161616] px-4 text-gray-500 font-bold tracking-widest">
                                                SECURE ACCESS
                                            </span>
                                        </div>
                                    </div>

                                    <p className="text-center text-gray-500 text-xs px-6 leading-relaxed">
                                        By continuing, you agree to our{" "}
                                        <a href="#" className="underline hover:text-white">Terms of Service</a> and{" "}
                                        <a href="#" className="underline hover:text-white">Privacy Policy</a>.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
