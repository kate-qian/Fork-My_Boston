import Link from "next/link";
import { notFound } from "next/navigation";
import pool from "../../../server/db";
import ItineraryVisitor, {
    ItineraryCardData,
} from "../../../components/ItineraryVisitor";
import NavBar from "../../../components/NavBar";

export const dynamic = "force-dynamic";

type UserCreatedData = {
    userId: string;
    displayName: string;
    itineraries: ItineraryCardData[];
};

async function getUserCreatedItineraries(
    userId: string
): Promise<UserCreatedData | null> {
    // 1. Fetch the user (and their array of created itinerary keys)
    // Guard against invalid UUID formats so PostgreSQL doesn't throw a syntax error
    const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
        return null;
    }

    const userResult = await pool.query(
        `
    SELECT
      user_id,
      user_email,
      created_ids
    FROM users
    WHERE user_id = $1
    LIMIT 1;
    `,
        [userId]
    );

    const user = userResult.rows[0];
    if (!user) return null;

    const createdIds: string[] = Array.isArray(user.created_ids)
        ? user.created_ids
        : [];

    // 2. If the user hasn't created anything yet, return an empty list without running a second query
    if (createdIds.length === 0) {
        return {
            userId: user.user_id,
            displayName: user.user_email ? user.user_email.split("@")[0] : "Explorer",
            itineraries: [],
        };
    }

    // 3. Fetch all itineraries matching the user's created keys
    const itinerariesResult = await pool.query(
        `
    SELECT
      key,
      name AS title,
      description,
      location,
      stops
    FROM itineraries
    WHERE key = ANY($1)
    ORDER BY created_at DESC;
    `,
        [createdIds]
    );

    const itineraries: ItineraryCardData[] = itinerariesResult.rows.map((row) => {
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
            key: String(row.key),
            title: row.title || "Untitled Itinerary",
            description: row.description || "",
            category: row.location || "Boston Adventure",
            stops: stopNames,
        };
    });

    return {
        userId: user.user_id,
        displayName: user.email ? user.email.split("@")[0] : "Explorer",
        itineraries,
    };
}

export default async function UserPinnedItinerariesPage({
    params,
}: {
    params: Promise<{ user_id: string }>;
}) {
    const { user_id } = await params;
    const data = await getUserCreatedItineraries(user_id);

    if (!data) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-[#F7F5EF] px-6 py-12 text-[#292D27]">
            <div className="mx-auto max-w-5xl">
                {/* Top navigation */}
                <NavBar />


                {/* User profile header */}
                <header className="mb-12">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#C97955]">
                        My Collection
                    </p>

                    <h1 className="font-serif text-4xl md:text-5xl">
                        {data.displayName}&apos;s My Itineraries
                    </h1>

                    <p className="mt-3 text-lg text-[#77796F]">
                        Saved Boston routes and favorite local spots.
                    </p>
                </header>

                {/* Reuse your existing search + itinerary cards component! */}
                <ItineraryVisitor initialItineraries={data.itineraries} />
            </div>
        </main >
    );
}