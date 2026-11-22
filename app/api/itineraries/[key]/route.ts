import { NextResponse } from "next/server";
import pool from "../../../../server/db";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ key: string }> }
) {
    try {
        const { key } = await params;
        const body = await request.json();
        const { user_id, title, description, location, stops } = body;

        if (!user_id || user_id === "0") {
            return NextResponse.json(
                { error: "You must be logged in to edit an itinerary." },
                { status: 401 }
            );
        }

        // 1. Verify the itinerary exists and check ownership
        const ownerCheck = await pool.query(
            `SELECT owner_id FROM itineraries WHERE key = $1 LIMIT 1;`,
            [key]
        );

        const existing = ownerCheck.rows[0];
        if (!existing) {
            return NextResponse.json(
                { error: "Itinerary not found." },
                { status: 404 }
            );
        }

        if (String(existing.owner_id) !== String(user_id)) {
            return NextResponse.json(
                { error: "Forbidden: You do not own this itinerary." },
                { status: 403 }
            );
        }

        // 2. Update the itinerary in Tiger Data
        const now = new Date().toISOString();

        const updateRes = await pool.query(
            `
      UPDATE itineraries
      SET
        name = $1,
        description = $2,
        location = $3,
        stops = $4::jsonb,
        last_edited_at = $5
      WHERE key = $6
      RETURNING *;
      `,
            [
                title,
                description,
                location || "Boston",
                JSON.stringify(stops || []),
                now,
                key,
            ]
        );

        return NextResponse.json(
            { message: "Itinerary updated", data: updateRes.rows[0] },
            { status: 200 }
        );
    } catch (error) {
        console.error("Update itinerary error:", error);
        return NextResponse.json(
            { error: "Failed to update itinerary." },
            { status: 500 }
        );
    }
}