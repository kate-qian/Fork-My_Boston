//"use client";

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
// import { useState } from "react";

// export default function HomePage() {
//     const [searchQuery, setSearchQuery] = useState("");

//     const itineraries = [{
//         id: "1",
//         title: "A perfect Saturday in Boston",
//         description: "Coffee, bookstores, and a walk along the Charles.",
//         category: "Outdoors",
//         stops: ["Tatte", "Harvard Square", "Charles River"],
//     }, {
//         id: "2",
//         title: "A North End food crawl",
//         description: "Pizza, pastries, and Italian food.",
//         category: "Food & Coffee",
//         stops: ["Mike's Pastry", "Regina Pizzeria"],
//     }];

//     const filteredItineraries = itineraries.filter((itinerary) => {
//         const searchableText = [
//             itinerary.title,
//             itinerary.description,
//             itinerary.category,
//             ...itinerary.stops,
//         ].join(" ").toLowerCase();

//         return searchableText.includes(searchQuery.toLowerCase());
//     });



export default async function HomePage() {
    const itineraries = await getPublishedItineraries();

    return (
        <main className="min-h-screen bg-[#F7F5EF] px-6 py-12 text-[#292D27]">
            <div className="mx-auto max-w-5xl">
                {/* Navigation */}
                <NavBar />

                {/* Welcome section */}
                <header className="mb-12 py-2">
                    <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#C97955]">
                        Fork My Boston
                    </p>

                    <h1 className="font-serif text-5xl">Welcome to Fork My Boston!</h1>

                    <p className="mt-4 text-xl text-[#77796F]">
                        Discover and share Boston adventures.
                    </p>
                </header>

                {/* Interactive search & database-backed itinerary cards */}
                <ItineraryVisitor initialItineraries={itineraries} />
            </div>
        </main>
    );
}

//     return (
//         <main className="min-h-screen bg-[#F7F5EF] px-6 py-12 text-[#292D27]">
//             <div className="mx-auto max-w-5xl">

//                 {/* Navigation */}
//                 <nav className="border-b border-[#E8E3D8] py-3">
//                     <div className="flex items-center justify-start gap-6">
//                         <a href="/create" className="font-serif text-lg font-bold tracking-tight transition hover:text-[#C97955]">
//                             Create a New Itinerary <span className="text-[#C97955]">.</span>
//                         </a>
//                     </div>
//                 </nav>

//                 {/* Welcome section */}
//                 <header className="mb-12 py-2">
//                     <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#C97955]">
//                         Fork My Boston
//                     </p>

//                     <h1 className="font-serif text-5xl">
//                         Welcome to Fork My Boston!
//                     </h1>

//                     <p className="mt-4 text-xl text-[#77796F]">
//                         Discover and share Boston adventures.
//                     </p>
//                 </header>

//                 {/* Search section */}
//                 <section className="mb-10">
//                     <h2 className="mb-4 font-serif text-3xl">
//                         Where to Next?
//                     </h2>

//                     <input
//                         type="text"
//                         placeholder="Try 'coffee shops in Cambridge'..."
//                         value={searchQuery}
//                         onChange={(e) => setSearchQuery(e.target.value)}
//                         className="w-full rounded-xl border border-[#E8E3D8] bg-white px-5 py-4 outline-none transition focus:border-[#C97955]"
//                     />
//                 </section>

//                 {/* Itinerary results */}
//                 <section>
//                     <div className="mb-6 flex items-center justify-between">
//                         <h2 className="font-serif text-3xl">
//                             Explore Itineraries
//                         </h2>

//                         <span className="text-sm text-[#929187]">
//                             <p className="mt-4 text-lg text-[#77796F]">
//                                 {filteredItineraries.length} Results</p>
//                         </span>
//                     </div>

//                     {filteredItineraries.length > 0 ? (
//                         <div className="grid gap-5 md:grid-cols-2">
//                             {filteredItineraries.map((itinerary) => (
//                                 <div
//                                     key={itinerary.id}
//                                     className="rounded-2xl border border-[#E8E3D8] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
//                                 >
//                                     <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#C97955]">
//                                         {itinerary.category}
//                                     </p>

//                                     <h3 className="font-serif text-2xl">
//                                         {itinerary.title}
//                                     </h3>

//                                     <p className="mt-3 text-sm leading-relaxed text-[#77796F]">
//                                         {itinerary.description}
//                                     </p>

//                                     <div className="my-5 border-t border-[#E8E3D8]" />

//                                     <p className="text-xs text-[#929187]">
//                                         {itinerary.stops.length} stops
//                                     </p>

//                                     <p className="mt-2 text-sm text-[#77796F]">
//                                         {itinerary.stops.join(" · ")}
//                                     </p>

//                                     <button className="mt-5 text-sm font-semibold text-[#C97955] hover:text-[#A85D3F]">
//                                         View itinerary →
//                                     </button>
//                                 </div>
//                             ))}
//                         </div>
//                     ) : (
//                         <div className="rounded-2xl border border-dashed border-[#D6CFC1] p-10 text-center">
//                             <h3 className="font-serif text-xl">
//                                 No adventures found just yet.
//                             </h3>

//                             <p className="mt-2 text-sm text-[#929187]">
//                                 Try another search!
//                             </p>
//                         </div>
//                     )}
//                 </section>
//             </div>
//         </main >
//     );
// }
