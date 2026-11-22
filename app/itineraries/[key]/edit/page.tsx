import { notFound } from "next/navigation";
import pool from "../../../../server/db";
import EditItineraryForm, {
    InitialEditItinerary,
    Stop,
} from "../../../../components/EditItineraryForm";

export const dynamic = "force-dynamic";

async function getItineraryForEdit(
    key: string
): Promise<InitialEditItinerary | null> {
    const result = await pool.query(
        `
        SELECT
            key,
            name AS title,
            description,
            location,
            owner_id,
            stops
        FROM itineraries
        WHERE key = $1
        LIMIT 1;
        `,
        [key]
    );

    const row = result.rows[0];
    if (!row) return null;

    const rawStops =
        typeof row.stops === "string" ? JSON.parse(row.stops) : row.stops || [];

    const normalizedStops: Stop[] = Array.isArray(rawStops)
        ? rawStops.map((stop: Partial<Stop> | string, index: number) => {
            if (typeof stop === "string") {
                return {
                    id: `stop-${index}-${row.key}`,
                    itinerary_id: String(row.key),
                    name: stop,
                    description: "",
                    location: "",
                    latitude: null,
                    longitude: null,
                    place_id: null,
                    time: "",
                    position_in_itinerary: index + 1,
                    input_mode: "manual",
                };
            }

            const hasCoords =
                stop.latitude !== null &&
                stop.latitude !== undefined &&
                stop.longitude !== null &&
                stop.longitude !== undefined;

            return {
                id: stop.id || `stop-${index}-${row.key}`,
                itinerary_id: String(row.key),
                name: stop.name || "",
                description: stop.description || "",
                location: stop.location || "",
                latitude: hasCoords ? Number(stop.latitude) : null,
                longitude: hasCoords ? Number(stop.longitude) : null,
                place_id: stop.place_id ?? null,
                time: stop.time || "",
                position_in_itinerary:
                    stop.position_in_itinerary ?? index + 1,
                input_mode:
                    stop.input_mode ?? (hasCoords ? "search" : "manual"),
            };
        })
        : [];

    return {
        key: String(row.key),
        owner_id: row.owner_id ? String(row.owner_id) : null,
        title: row.title || "",
        description: row.description || "",
        location: row.location || "Boston",
        stops: normalizedStops,
    };
}

export default async function EditItineraryPage({
    params,
}: {
    params: Promise<{ key: string }>;
}) {
    const { key } = await params;
    const itinerary = await getItineraryForEdit(key);

    if (!itinerary) {
        notFound();
    }

    return <EditItineraryForm initialData={itinerary} />;
}