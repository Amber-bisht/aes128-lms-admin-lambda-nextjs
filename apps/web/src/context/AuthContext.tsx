"use client";

import React, { createContext, useContext, useState } from "react";

interface AuthUIContextType {
    isAuthModalOpen: boolean;
    openAuthModal: () => void;
    closeAuthModal: () => void;
}

const AuthUIContext = createContext<AuthUIContextType | undefined>(undefined);

export function AuthUIProvider({ children }: { children: React.ReactNode }) {
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    const openAuthModal = () => setIsAuthModalOpen(true);
    const closeAuthModal = () => setIsAuthModalOpen(false);

    return (
        <AuthUIContext.Provider value={{ isAuthModalOpen, openAuthModal, closeAuthModal }}>
            {children}
        </AuthUIContext.Provider>
    );
}

export function useAuthUI() {
    const context = useContext(AuthUIContext);
    if (context === undefined) {
        throw new Error("useAuthUI must be used within an AuthUIProvider");
    }
    return context;
}
