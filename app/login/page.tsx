
"use client";

import { useState } from "react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    function handleLogin(e: React.FormEvent) {
        e.preventDefault();

        // Authentication will be connected later.
        alert("Login isn't connected yet!");
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
