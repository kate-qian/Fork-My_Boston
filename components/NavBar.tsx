"use client";

import { useState } from "react";
import { useAuth } from "../app/context/AuthContext";
import Link from "next/link";

export default function NavBar() {
    //const [isLoggedIn, setIsLoggedIn] = useState(false);
    const { user_logged_in, isGuest } = useAuth();
    const { login } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <nav className="border-b border-[#E8E3D8] pt-3 pb-1">
            <div className="flex items-center justify-between">

                {/* Left side */}
                <div className="flex items-center gap-8">
                    <a
                        href="/"
                        className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#C97955] hover:text-[#C97955]"
                    >
                        Fork My Boston<span className="text-[#C97955]"></span>
                    </a>

                    <a
                        href="/create"
                        className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#C97955] hover:text-[#C97955]"
                    >
                        Create an Itinerary<span className="text-[#C97955]"></span>
                    </a>
                </div>

                {/* Right side */}
                {isGuest ? (
                    <div className="flex items-center gap-4">
                        <a
                            href="/login"
                            className="text-med font-semibold text-[#77796F] transition hover:text-[#C97955]"
                        >
                            Log In
                        </a>

                        <a
                            href="/signup"
                            className="rounded-full bg-[#C97955] px-5 py-2.5 text-med font-semibold text-white transition hover:bg-[#A85D3F]"
                        >
                            Sign Up
                        </a>
                    </div>
                ) : (
                    <div className="relative pb-2">
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="flex items-center gap-2"
                        >
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E8D4C6] font-semibold text-[#A85D3F]">
                                {user_logged_in ? user_logged_in.trim().charAt(0).toUpperCase() : "A"}
                            </div>

                            <span className="text-sm text-[#77796F]">⌄</span>
                        </button>

                        {menuOpen && (
                            <div className="absolute right-0 z-50 mt-3 w-48 rounded-xl border border-[#E8E3D8] bg-white py-2 shadow-lg">
                                {/* <a
                                    href="/profile"
                                    className="block px-4 py-2 text-sm hover:bg-[#F7F5EF]"
                                >
                                    My Profile
                                </a> */}

                                <Link
                                    href={`/my_itineraries/${user_logged_in}`}
                                    className="block px-4 py-2 text-sm hover:bg-[#F7F5EF]"
                                >
                                    My Itineraries
                                </Link>
                                {/* <a
                                    href="/my-itineraries"
                                    className="block px-4 py-2 text-sm hover:bg-[#F7F5EF]"
                                >
                                    My Itineraries
                                </a> */}

                                <Link
                                    href={`/pinned/${user_logged_in}`}
                                    className="block px-4 py-2 text-sm hover:bg-[#F7F5EF]"
                                >
                                    Pinned Itineraries
                                </Link>
                                {/* <a
                                    href="/saved"
                                    className="block px-4 py-2 text-sm hover:bg-[#F7F5EF]"
                                >
                                    Saved Itineraries
                                </a> */}

                                <div className="my-2 border-t border-[#E8E3D8]" />

                                <button
                                    onClick={() => {
                                        // Updates global user_logged_in state, localStorage, and cookie
                                        login("0");
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
