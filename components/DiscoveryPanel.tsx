"use client";

import { useState } from "react";
import type { SelectedPlace } from "./PlaceSearch";

type Recommendation = {
    id: string;
    name: string;
    category: string;
    neighborhood: string | null;
    address: string | null;
    latitude: number;
    longitude: number;
    website: string | null;
    reason: string;
};

type DiscoveryPanelProps = {
    onAddPlace: (place: SelectedPlace, reason: string) => void;
};

export default function DiscoveryPanel({ onAddPlace }: DiscoveryPanelProps) {
    const [query, setQuery] = useState("");
    const [preferences, setPreferences] = useState("");
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [addedIds, setAddedIds] = useState<string[]>([]);

    async function handleDiscover() {
        if (!query.trim() || loading) return;

        setLoading(true);
        setError("");
        setRecommendations([]);
        setAddedIds([]);

        try {
            const response = await fetch("/api/discover", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    query: query.trim(),
                    preferences: preferences.trim(),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Discovery failed.");
            }

            if (!Array.isArray(data.recommendations)) {
                throw new Error("The discovery service returned an unexpected response.");
            }

            setRecommendations(data.recommendations);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }

    function handleAdd(recommendation: Recommendation) {
        onAddPlace(
            {
                name: recommendation.name,
                address: recommendation.address || "Boston, MA",
                placeId: recommendation.id,
                latitude: recommendation.latitude,
                longitude: recommendation.longitude,
            },
            recommendation.reason
        );

        setAddedIds((previous) => [...previous, recommendation.id]);
    }

    return (
        <section className="rounded-2xl border border-[#E8E3D8] bg-white p-6 shadow-sm">
            <div className="mb-5">
                <div className="flex items-center gap-2">
                    <span className="text-xl">✦</span>
                    <h2 className="text-lg font-semibold text-[#292D27]">
                        Discover with AI
                    </h2>
                </div>

                <p className="mt-1 text-sm text-[#929187]">
                </p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="mb-2 block text-sm font-medium text-[#55594F]">
                        What are you looking for?
                    </label>

                    <textarea
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="ex. Find cozy independent cafés in the South End..."
                        rows={3}
                        className="w-full resize-none rounded-lg border border-[#E8E3D8] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#C97955]"
                    />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium text-[#55594F]">
                        Preferences <span className="font-normal text-[#929187]">(optional)</span>
                    </label>

                    <input
                        value={preferences}
                        onChange={(event) => setPreferences(event.target.value)}
                        placeholder="ex. Independent businesses, relaxed atmosphere, outdoor seating"
                        className="w-full rounded-lg border border-[#E8E3D8] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#C97955]"
                    />
                </div>

                <button
                    type="button"
                    onClick={handleDiscover}
                    disabled={!query.trim() || loading}
                    className="w-full rounded-xl bg-[#34483B] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#293A30] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading ? "Finding places..." : "✦ Discover places"}
                </button>
            </div>

            {error && (
                <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            {loading && (
                <div className="mt-5 rounded-xl bg-[#F7F5EF] p-5 text-center">
                    <p className="text-sm font-medium text-[#34483B]">
                        Exploring Boston for you...
                    </p>
                    <p className="mt-1 text-xs text-[#929187]">
                        Matching your request with places in our local knowledge base.
                    </p>
                </div>
            )}

            {recommendations.length > 0 && (
                <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-[#34483B]">
                            Your recommendations
                        </h3>
                        <span className="text-xs text-[#929187]">
                            {recommendations.length} places
                        </span>
                    </div>

                    {recommendations.map((place) => {
                        const added = addedIds.includes(place.id);

                        return (
                            <article
                                key={place.id}
                                className="rounded-xl border border-[#E8E3D8] bg-[#FDFCF9] p-4"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-semibold text-[#292D27]">
                                            {place.name}
                                        </h4>

                                        <p className="mt-1 text-xs capitalize text-[#929187]">
                                            {place.category}
                                            {place.neighborhood
                                                ? ` · ${place.neighborhood}`
                                                : ""}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleAdd(place)}
                                        disabled={added}
                                        className="shrink-0 rounded-lg bg-[#34483B] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#293A30] disabled:bg-[#E8E3D8] disabled:text-[#71816E]"
                                    >
                                        {added ? "✓ Added" : "+ Add"}
                                    </button>
                                </div>

                                {place.address && (
                                    <p className="mt-2 text-xs text-[#77796F]">
                                        {place.address}
                                    </p>
                                )}

                                <p className="mt-3 text-sm leading-relaxed text-[#55594F]">
                                    {place.reason}
                                </p>

                                {place.website && (
                                    <a
                                        href={place.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-2 inline-block text-xs font-medium text-[#C97955] hover:underline"
                                    >
                                        Visit website ↗
                                    </a>
                                )}
                            </article>
                        );
                    })}
                </div>
            )}

            {!loading && !error && recommendations.length === 0 && (
                <p className="mt-4 text-center text-xs text-[#929187]">
                    Your recommendations will appear here.
                </p>
            )}
        </section>
    );
}