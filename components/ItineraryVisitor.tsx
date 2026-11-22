"use client";

import { useState } from "react";
import Link from "next/link";

export type ItineraryCardData = {
    key: string;
    title: string;
    description: string;
    category: string;
    stops: string[];
};

export default function ItineraryVisitor({
    initialItineraries,
}: {
    initialItineraries: ItineraryCardData[];
}) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredItineraries = initialItineraries.filter((itinerary) => {
        const searchableText = [
            itinerary.title,
            itinerary.description,
            itinerary.category,
            ...itinerary.stops,
        ]
            .join(" ")
            .toLowerCase();

        return searchableText.includes(searchQuery.toLowerCase());
    });

    return (
        <>
            {/* Search section */}
            <section className="mb-10">
                <h2 className="mb-4 font-serif text-3xl">Where to Next?</h2>

                <input
                    type="text"
                    placeholder="Try 'coffee shops in Cambridge'..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-[#E8E3D8] bg-white px-5 py-4 outline-none transition focus:border-[#C97955]"
                />
            </section>

            {/* Itinerary results */}
            <section>
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="font-serif text-3xl">Explore Itineraries</h2>

                    <p className="text-lg text-[#77796F]">
                        {filteredItineraries.length}{" "}
                        {filteredItineraries.length === 1 ? "Result" : "Results"}
                    </p>
                </div>

                {filteredItineraries.length > 0 ? (
                    <div className="grid gap-5 md:grid-cols-2">
                        {filteredItineraries.map((itinerary) => (
                            <div
                                key={itinerary.key}
                                className="rounded-2xl border border-[#E8E3D8] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                            >
                                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#C97955]">
                                    {itinerary.category}
                                </p>

                                <h3 className="font-serif text-2xl">{itinerary.title}</h3>

                                <p className="mt-3 text-sm leading-relaxed text-[#77796F]">
                                    {itinerary.description}
                                </p>

                                <div className="my-5 border-t border-[#E8E3D8]" />

                                <p className="text-xs text-[#929187]">
                                    {itinerary.stops.length}{" "}
                                    {itinerary.stops.length === 1 ? "stop" : "stops"}
                                </p>

                                <p className="mt-2 text-sm text-[#77796F]">
                                    {itinerary.stops.join(" · ")}
                                </p>

                                <Link
                                    href={`/itineraries/${itinerary.key}`}
                                    className="mt-5 inline-block text-sm font-semibold text-[#C97955] hover:text-[#A85D3F]"
                                >
                                    View itinerary →
                                </Link>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-dashed border-[#D6CFC1] p-10 text-center">
                        <h3 className="font-serif text-xl">
                            No adventures found just yet.
                        </h3>

                        <p className="mt-2 text-sm text-[#929187]">
                            Try another search!
                        </p>
                    </div>
                )}
            </section>
        </>
    );
}