
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { login } = useAuth();
    const router = useRouter();

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setErrorMessage(null);
        setIsSubmitting(true);

        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Invalid login credentials.");
            }

            // Updates global user_logged_in state, localStorage, and cookie
            login(data.user_id);

            // Redirect to homepage after logging in
            router.push("/");
        } catch (err) {
            setErrorMessage(
                err instanceof Error ? err.message : "Something went wrong."
            );
        } finally {
            setIsSubmitting(false);
        }
    }


    return (
        <main className="flex min-h-screen items-center justify-center bg-[#F7F5EF] px-6 py-12 text-[#292D27]">
            <div className="w-full max-w-md rounded-2xl border border-[#E8E3D8] bg-white p-8 shadow-sm">
                <a href="/" className="font-serif text-lg font-bold hover:text-[#C97955]">
                    Fork My Boston<span className="text-[#C97955]">.</span>
                </a>

                <h1 className="mt-8 font-serif text-4xl">
                    Welcome back!
                </h1>

                <p className="mt-3 text-sm text-[#77796F]">
                    Log in to access your saved Boston adventures.
                </p>

                {errorMessage && (
                    <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {errorMessage}
                    </div>
                )}

                <form onSubmit={handleLogin} className="mt-8 space-y-5">
                    <div>
                        <label className="mb-2 block text-sm font-semibold">
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full rounded-xl border border-[#E8E3D8] px-4 py-3 outline-none focus:border-[#C97955]"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold">
                            Password
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            className="w-full rounded-xl border border-[#E8E3D8] px-4 py-3 outline-none focus:border-[#C97955]"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full rounded-full bg-[#C97955] py-3 font-semibold text-white transition hover:bg-[#A85D3F]"
                    >
                        Log In
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-[#77796F]">
                    Don't have an account?{" "}
                    <a href="/signup" className="font-semibold text-[#C97955] hover:text-[#A85D3F]">
                        Sign up
                    </a>
                </p>

                <p className="mt-4 text-center text-sm">
                    <a href="/" className="text-[#929187] hover:text-[#C97955]">
                        Back
                    </a>
                </p>
            </div>
        </main>
    );
}
