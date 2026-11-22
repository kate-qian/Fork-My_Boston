// "use client";

import pool from "../server/db";
import ItineraryVisitor, { ItineraryCardData, } from "@/components/ItineraryVisitor";
import NavBar from "../components/NavBar";

// every time page is reload updates database results
export const dynamic = "force-dynamic";

async function getPublishedItineraries(): Promise<ItineraryCardData[]> {
    const result = await pool.query(`
    SELECT
      key,
      name AS title,
      description,
      location,
      stops
    FROM itineraries
    WHERE published = true
    ORDER BY created_at DESC;
  `);

    return result.rows.map((row) => {
        // Parse stops safely whether pg returns JSONB as an array or a JSON string
        const rawStops =
            typeof row.stops === "string" ? JSON.parse(row.stops) : row.stops || [];

        const stopNames = Array.isArray(rawStops)
            ? rawStops
                .map((stop: { name?: string } | string) =>
                    typeof stop === "string" ? stop : stop.name || ""
                )
                .filter(Boolean)
            : [];

        return {
            key: row.key,
            title: row.title || "Untitled Itinerary",
            description: row.description || "",
            category: row.location || "Boston Adventure",
            stops: stopNames,
        };
    });
}

export default async function HomePage() {
    const itineraries = await getPublishedItineraries();

    return (
        <main className="min-h-screen bg-[#F7F5EF] px-6 py-12 text-[#292D27]">
            <div className="mx-auto max-w-5xl">
                {/* Navigation */}
                <NavBar />

                {/* Welcome section */}
                <header className="mb-12">
                    <div className="mx-auto flex max-w-6xl justify-between gap-8 pt-4">
                        {/* Left: Welcome text */}
                        <div className="flex flex-7 flex-col items-start">
                            <h1 className="font-serif pt-20 text-bold text-5xl">
                                Welcome to Fork My Boston!
                            </h1>

                            <p className="text-lg pb-20 text-[#34483B] px-1.5">
                                Discover and share your Boston adventures.
                            </p>
                        </div>

                        {/* Right: Image */}
                        <div className="flex-3 pt-10 pr-16">
                            <img
                                src="../bostonhackslobster.png"
                                className="w-full max-w-sm h-auto"
                            />
                        </div>
                    </div>
                </header>

                {/* Interactive search & database-backed itinerary cards */}
                <ItineraryVisitor initialItineraries={itineraries} />
            </div>
        </main>
    );
}