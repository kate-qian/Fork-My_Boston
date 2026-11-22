"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../app/context/AuthContext";

type ItineraryActionsProps = {
    itineraryKey: string;
    ownerId: string | null;
};

export default function ItineraryActions({
    itineraryKey,
    ownerId,
}: ItineraryActionsProps) {
    const { user_logged_in, isGuest } = useAuth();
    const router = useRouter();

    const [isPinned, setIsPinned] = useState(false);
    const [isPinning, setIsPinning] = useState(false);
    const [isForking, setIsForking] = useState(false);

    // Check if the logged-in user owns this itinerary
    const isOwner = !isGuest && Boolean(ownerId) && user_logged_in === ownerId;

    async function handlePin() {
        if (isGuest) {
            router.push("/login");
            return;
        }

        setIsPinning(true);
        try {
            const response = await fetch("/api/pin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: user_logged_in,
                    itinerary_key: itineraryKey,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to pin itinerary.");
            }

            const data = await response.json();
            setIsPinned(data.pinned ?? !isPinned);
        } catch (error) {
            console.error("Pin error:", error);
            alert("Could not update pin status.");
        } finally {
            setIsPinning(false);
        }
    }

    async function handleFork() {
        if (isGuest) {
            router.push("/login");
            return;
        }

        setIsForking(true);
        try {
            const response = await fetch("/api/fork", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: user_logged_in,
                    source_key: itineraryKey,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to fork itinerary.");
            }

            // Navigate straight to the newly forked copy (or its edit page)
            router.push(`/itineraries/${data.new_key}`);
        } catch (error) {
            console.error("Fork error:", error);
            alert("Could not fork itinerary.");
        } finally {
            setIsForking(false);
        }
    }

    return (
        <div className="mt-6 flex flex-wrap items-center gap-3">
            {/* 1. Pin Button */}
            <button
                type="button"
                onClick={handlePin}
                disabled={isPinning}
                className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${isPinned
                    ? "border-[#C97955] bg-[#C97955]/10 text-[#C97955]"
                    : "border-[#E8E3D8] bg-white text-[#292D27] hover:border-[#C97955] hover:text-[#C97955]"
                    }`}
            >
                {isPinning ? "Saving..." : isPinned ? "Pinned ✓" : "Pin Itinerary"}
            </button>

            {/* 2. Fork Button */}
            <button
                type="button"
                onClick={handleFork}
                disabled={isForking}
                className="rounded-full bg-[#C97955] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#A85D3F] disabled:opacity-50"
            >
                {isForking ? "Forking..." : "Fork Itinerary"}
            </button>

            {/* 3. Edit Button (Only shown when user_logged_in === owner_id) */}
            {isOwner && (
                <Link
                    href={`/itineraries/${itineraryKey}/edit`}
                    className="rounded-full border border-[#292D27] px-5 py-2.5 text-sm font-semibold text-[#292D27] transition hover:bg-[#292D27] hover:text-white"
                >
                    Edit Itinerary
                </Link>
            )}
        </div>
    );
}