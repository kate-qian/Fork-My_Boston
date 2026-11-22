"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type AuthContextType = {
    user_logged_in: string; // 0 = guest, UUID string = logged-in user ID
    login: (userId: string) => void;
    logout: () => void;
    isGuest: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user_logged_in, setUserLoggedIn] = useState<string>("0");

    // Restore saved user ID on page load/refresh
    useEffect(() => {
        const savedId = localStorage.getItem("user_logged_in");
        if (savedId && savedId != ")") {
            setUserLoggedIn(savedId);

        }
    }, []);

    function login(userId: string) {
        setUserLoggedIn(userId);
        localStorage.setItem("user_logged_in", userId);
        // Also set a cookie so Next.js Server Components / API routes can read it
        document.cookie = `user_logged_in=${userId}; path=/; max-age=604800`;
    }

    function logout() {
        setUserLoggedIn("0");
        localStorage.removeItem("user_logged_in");
        document.cookie = "user_logged_in=0; path=/; max-age=0";
    }

    return (
        <AuthContext.Provider
            value={{
                user_logged_in,
                login,
                logout,
                isGuest: user_logged_in === "0",
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook to read user_logged_in anywhere in your app
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used inside an AuthProvider");
    }
    return context;
}