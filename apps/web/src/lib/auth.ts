
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === "google" && account.id_token) {
                try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/google`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ token: account.id_token }),
                    });

                    const data = await res.json();

                    if (res.ok && data.token) {
                        // Attach app token to user object temporarily to persist in jwt callback
                        (user as any).appToken = data.token;
                        (user as any).role = data.user.role;
                        return true;
                    }
                    return false;
                } catch (e) {
                    console.error("Backend auth failed", e);
                    return false;
                }
            }
            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.appToken = (user as any).appToken;
                token.role = (user as any).role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session as any).appToken = token.appToken;
                (session as any).user.role = token.role;
            }
            return session;
        },
    },
    pages: {
        signIn: "/auth/signin", // Custom signin page
    }
};
