import { NextResponse } from "next/server";
import pool from "../../../server/db";

export async function POST(request: Request) {
    try {
        const { user_id, itinerary_key } = await request.json();

        if (!user_id || user_id === "0" || !itinerary_key) {
            return NextResponse.json(
                { error: "Valid user_id and itinerary_key are required." },
                { status: 400 }
            );
        }

        // Check current pinned_itinerary_ids array
        const userRes = await pool.query(
            `SELECT COALESCE(pinned_ids, '{}') AS pinned FROM users WHERE user_id = $1 LIMIT 1;`,
            [user_id]
        );

        if (userRes.rows.length === 0) {
            return NextResponse.json({ error: "User not found." }, { status: 404 });
        }

        const currentPinned: string[] = userRes.rows[0].pinned.map(String);
        const alreadyPinned = currentPinned.includes(String(itinerary_key));

        // Toggle: remove if already pinned, append if not
        const updateQuery = alreadyPinned
            ? `UPDATE users SET pinned_ids = array_remove(pinned_ids, $1) WHERE user_id = $2 RETURNING pinned_ids;`
            : `UPDATE users SET pinned_ids = array_append(COALESCE(pinned_ids, '{}'), $1) WHERE user_id = $2 RETURNING pinned_ids;`;

        await pool.query(updateQuery, [itinerary_key, user_id]);

        return NextResponse.json(
            { pinned: !alreadyPinned },
            { status: 200 }
        );
    } catch (error) {
        console.error("Pin toggle error:", error);
        return NextResponse.json(
            { error: "Failed to update pinned itinerary." },
            { status: 500 }
        );
    }
}