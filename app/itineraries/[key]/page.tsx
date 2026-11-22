import { notFound } from "next/navigation";
import pool from "../../../server/db";
import ItineraryActions from "../../../components/ItineraryActions";
import NavBar from "../../../components/NavBar";

// Ensures fresh data from Tiger Data on every visit
export const dynamic = "force-dynamic";

type Stop = {
    name?: string;
    location?: string;
    time?: string;
    notes?: string;
    description?: string;
};

type ItineraryDetail = {
    key: string;
    title: string;
    description: string;
    location: string;
    ownerId: string | null;
    createdAt: string | null;
    stops: Stop[];
};

async function getItineraryById(key: string): Promise<ItineraryDetail | null> {
    const result = await pool.query(
        `
    SELECT
      key,
      name AS title,
      description,
      location,
      owner_id,
      stops,
      created_at
    FROM itineraries
    WHERE key = $1
    LIMIT 1;
    `,
        [key]
    );

    const row = result.rows[0];
    if (!row) return null;

    // Normalize stops whether stored as a JSON string or JSONB array
    const rawStops =
        typeof row.stops === "string" ? JSON.parse(row.stops) : row.stops || [];

    const normalizedStops: Stop[] = Array.isArray(rawStops)
        ? rawStops.map((stop: Stop | string) =>
            typeof stop === "string" ? { name: stop } : stop
        )
        : [];

    return {
        key: String(row.key),
        title: row.title || "Untitled Itinerary",
        description: row.description || "",
        location: row.location || "Boston, MA",
        ownerId: row.owner_id ? String(row.owner_id) : null,
        createdAt: row.created_at
            ? new Date(row.created_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
            })
            : null,
        stops: normalizedStops,
    };
}

export default async function ItineraryDetailPage({
    params,
}: {
    params: Promise<{ key: string }>;
}) {
    // 1. Extract the unique ID from the URL
    const { key } = await params;

    // 2. Fetch the matching itinerary from Tiger Data
    const itinerary = await getItineraryById(key);

    // 3. Render Next.js's 404 page if no matching ID exists in the database
    if (!itinerary) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-[#F7F5EF] px-6 py-12 text-[#292D27]">
            <div className="mx-auto max-w-3xl">
                {/* Top navigation */}
                <NavBar />


                {/* Itinerary header */}
                <header className="mb-10">
                    <div className="flex flex-wrap items-center gap-3 pt-2 pb-1">
                        <span className="text-xs font-semibold uppercase tracking-widest text-[#C97955]">
                            {itinerary.location}
                        </span>
                        {itinerary.createdAt && (
                            <span className="text-xs text-[#929187]">
                                · Posted {itinerary.createdAt}
                            </span>
                        )}
                    </div>

                    <h1 className="mt-3 font-serif text-4xl md:text-5xl">
                        {itinerary.title}
                    </h1>

                    {itinerary.description && (
                        <p className="mt-4 text-lg leading-relaxed text-[#77796F]">
                            {itinerary.description}
                        </p>
                    )}

                    {/* Pin, Fork, and Owner-only Edit buttons */}
                    <ItineraryActions
                        itineraryKey={itinerary.key}
                        ownerId={itinerary.ownerId}
                    />
                </header>

                {/* Stops timeline */}
                <section>
                    <h2 className="mb-6 font-serif text-2xl">
                        Itinerary Stops ({itinerary.stops.length})
                    </h2>

                    {itinerary.stops.length > 0 ? (
                        <ol className="space-y-4">
                            {itinerary.stops.map((stop, index) => (
                                <li
                                    key={index}
                                    className="rounded-2xl border border-[#E8E3D8] bg-white p-6 shadow-sm"
                                >
                                    <div className="flex items-start gap-4">
                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#C97955]/15 text-sm font-bold text-[#C97955]">
                                            {index + 1}
                                        </span>

                                        <div className="w-full">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <h3 className="font-serif text-xl">
                                                    {stop.name || `Stop ${index + 1}`}
                                                </h3>

                                                {stop.time && (
                                                    <span className="rounded-full bg-[#F7F5EF] px-3 py-1 text-xs font-semibold text-[#77796F]">
                                                        {stop.time}
                                                    </span>
                                                )}
                                            </div>

                                            {stop.location && (
                                                <p className="mt-1 text-sm font-medium text-[#C97955]">
                                                    {stop.location}
                                                </p>
                                            )}

                                            {(stop.notes || stop.description) && (
                                                <p className="mt-3 text-sm leading-relaxed text-[#77796F]">
                                                    {stop.notes || stop.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-[#D6CFC1] p-8 text-center text-sm text-[#929187]">
                            No stops were added to this itinerary.
                        </div>
                    )}
                </section>
            </div>
        </main >
    );
}