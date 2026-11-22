"use client";

import { useState } from "react";


export default function SignupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    async function handlePublish() {
        // if (!title.trim()) {
        //     setStatusMessage({ type: "error", text: "Please enter an itinerary name." });
        //     return;
        // }

        // setIsSubmitting(true);
        // setStatusMessage(null);

        const userId = crypto.randomUUID();
        const now = new Date().toISOString();


        const payload = {
            user_id: userId,
            username: "",
            user_email: email,
            created_at: now,
        };

        try {
            const response = await fetch("/api/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to sign up");
            }

            // setStatusMessage({
            //     type: "success",
            //     text: "Your itinerary has been published and saved!",
            // });
        } catch (error) {
            console.error("Publish error:", error);
            // setStatusMessage({
            //     type: "error",
            //     text: "Something went wrong while saving your itinerary.",
            // });
        } finally {
            //setIsSubmitting(false);
        }
    }

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
                    Welcome to Fork My Boston!
                </h1>

                <p className="mt-3 text-sm text-[#77796F]">
                    Sign up to create and save your Boston adventures.
                </p>

                <form onSubmit={handlePublish} className="mt-8 space-y-5">
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
                        Sign up
                    </button>
                </form>

                <a
                    href="/login"
                    className="mt-6 inline-block text-sm font-semibold text-[#C97955] hover:text-[#A85D3F]"
                >
                    Already have an account? Log In
                </a>

                <p className="mt-4 text-center text-sm">
                    <a href="/" className="text-[#929187] hover:text-[#C97955]">
                        Back
                    </a>
                </p>
            </div>
        </main>
    );

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#F7F5EF] text-[#292D27]">
            <div className="rounded-2xl border border-[#E8E3D8] bg-white p-10 text-center shadow-sm">
                <h1 className="font-serif text-4xl">
                    Welcome to Fork My Boston!
                </h1>

                <p className="mt-4 text-[#77796F]">
                    Create an Account
                </p>

                <a
                    href="/login"
                    className="mt-6 inline-block text-sm font-semibold text-[#C97955] hover:text-[#A85D3F]"
                >
                    Already have an account? Log In
                </a>

                <p className="mt-4 text-center text-sm">
                    <a href="/" className="text-[#929187] hover:text-[#C97955]">
                        Back
                    </a>
                </p>
            </div>
        </main>
    );
}



