"use client";

import { useState } from "react";

export default function NavBar() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <nav className="border-b border-[#E8E3D8] py-3">
            <div className="flex items-center justify-between px-6">

                {/* Left side */}
                <div className="flex items-center gap-6">
                    <a
                        href="/"
                        className="font-serif text-lg font-bold tracking-tight transition hover:text-[#C97955]"
                    >
                        Fork My Boston<span className="text-[#C97955]">.</span>
                    </a>

                    <a
                        href="/create"
                        className="font-serif text-sm font-semibold transition hover:text-[#C97955]"
                    >
                        Create an Itinerary
                    </a>
                </div>

                {/* Right side */}
                {!isLoggedIn ? (
                    <div className="flex items-center gap-4">
                        <a
                            href="/login"
                            className="text-sm font-semibold text-[#77796F] transition hover:text-[#C97955]"
                        >
                            Log In
                        </a>

                        <a
                            href="/signup"
                            className="rounded-full bg-[#C97955] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#A85D3F]"
                        >
                            Sign Up
                        </a>
                    </div>
                ) : (
                    <div className="relative">
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="flex items-center gap-2"
                        >
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E8D4C6] font-semibold text-[#A85D3F]">
                                A
                            </div>

                            <span className="text-sm text-[#77796F]">⌄</span>
                        </button>

                        {menuOpen && (
                            <div className="absolute right-0 z-50 mt-3 w-48 rounded-xl border border-[#E8E3D8] bg-white py-2 shadow-lg">
                                <a
                                    href="/profile"
                                    className="block px-4 py-2 text-sm hover:bg-[#F7F5EF]"
                                >
                                    My Profile
                                </a>

                                <a
                                    href="/my-itineraries"
                                    className="block px-4 py-2 text-sm hover:bg-[#F7F5EF]"
                                >
                                    My Itineraries
                                </a>

                                <a
                                    href="/saved"
                                    className="block px-4 py-2 text-sm hover:bg-[#F7F5EF]"
                                >
                                    Saved Itineraries
                                </a>

                                <div className="my-2 border-t border-[#E8E3D8]" />

                                <button
                                    onClick={() => {
                                        setIsLoggedIn(false);
                                        setMenuOpen(false);
                                    }}
                                    className="block w-full px-4 py-2 text-left text-sm text-[#C97955] hover:bg-[#F7F5EF]"
                                >
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
}
