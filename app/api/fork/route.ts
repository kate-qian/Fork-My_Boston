import { NextResponse } from "next/server";
import pool from "../../../server/db";

export async function POST(request: Request) {
    try {
        const { user_id, source_key } = await request.json();

        if (!user_id || user_id === "0" || !source_key) {
            return NextResponse.json(
                { error: "Valid user_id and source_key are required." },
                { status: 400 }
            );
        }

        // 1. Fetch the original itinerary
        const sourceRes = await pool.query(
            `SELECT name, description, location, body, timeframe, stops, published FROM itineraries WHERE key = $1 LIMIT 1;`,
            [source_key]
        );

        const original = sourceRes.rows[0];
        if (!original) {
            return NextResponse.json(
                { error: "Original itinerary not found." },
                { status: 404 }
            );
        }

        const now = new Date().toISOString();
        const forkedTitle = `${original.name} (Forked)`;

        // 2. Insert a cloned copy with a new UUID key and the current user as owner_id
        const insertRes = await pool.query(
            `
      INSERT INTO itineraries (
        key, name, description, location, created_at, last_edited_at,
        body, timeframe, pins, stops, published, owner_id
      )
      VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $4,
        $5, $6, $7, $8::jsonb, $9, $10
      )
      RETURNING key, created_at;
      `,
            [
                forkedTitle,
                original.description,
                original.location,
                now,
                original.body ?? "",
                original.timeframe ?? "",
                0,
                JSON.stringify(original.stops || []),
                original.published ?? true,
                user_id,
            ]
        );

        const newKey = insertRes.rows[0].key;
        const newTimestamp = insertRes.rows[0].created_at ?? now;

        // 3. Record the forked itinerary on the user's created_ids and created_timestamps
        await pool.query(
            `
      UPDATE users
      SET
        created_ids = array_append(COALESCE(created_ids, '{}'), $1),
        created_timestamps = array_append(COALESCE(created_timestamps, '{}'), $2)
      WHERE user_id = $3;
      `,
            [newKey, newTimestamp, user_id]
        );

        return NextResponse.json({ new_key: newKey }, { status: 201 });
    } catch (error) {
        console.error("Fork error:", error);
        return NextResponse.json(
            { error: "Failed to fork itinerary." },
            { status: 500 }
        );
    }
}