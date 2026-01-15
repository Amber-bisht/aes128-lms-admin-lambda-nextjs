
"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion } from "framer-motion";

function SignInContent() {
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

    return (
        <div className="flex min-h-screen items-center justify-center relative overlow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-black to-black z-[-1]" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card w-full max-w-md p-8 text-center"
            >
                <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                    Welcome Back
                </h1>
                <p className="text-muted-foreground mb-8">Sign in to continue your learning journey</p>

                <button
                    onClick={() => signIn("google", { callbackUrl })}
                    className="btn w-full justify-center bg-white text-black hover:bg-gray-200 transition-all font-bold py-3 px-6 rounded-lg flex items-center gap-2"
                >
                    Login with Google
                </button>
            </motion.div>
        </div>
    );
}

export default function SignIn() {
    return (
        <Suspense fallback={<div className="min-h-screen grid place-items-center">Loading...</div>}>
            <SignInContent />
        </Suspense>
    );
}
