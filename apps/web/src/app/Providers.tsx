
"use client";

import { SessionProvider } from "next-auth/react";
import { AuthUIProvider } from "@/context/AuthContext";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <AuthUIProvider>
                {children}
            </AuthUIProvider>
        </SessionProvider>
    );
}
