import { NextResponse } from 'next/server';
// import pool from '@/server/db';
import pool from '../../../server/db';

type Stop = {
    id: string;
    itinerary_id: string;
    name: string;
    description: string;
    location: string;
    time: string;
    position_in_itinerary: number;
};

interface FormPayload {
    id: string;
    title: string;
    description: string;
    location: string;
    travel_date: string;
    created: string;
    last_updated: string;
    published: boolean;
    stops: Stop[]
    owner_id: string;
}

export async function POST(request: Request) {
    try {
        const body: FormPayload = await request.json();

        const query = `
      INSERT INTO itineraries (key, name, description, location, created_at, 
      last_edited_at, body, timeframe, stops, published, pins, owner_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11, $12)
      RETURNING *;
    `;
        const values = [body.id, body.title, body.description, body.location,
        body.created, body.last_updated, "", body.travel_date,
        JSON.stringify(body.stops || []), body.published, 0, body.owner_id];

        const result = await pool.query(query, values);
        const savedItinerary = result.rows[0];

        const newId = savedItinerary.key ?? body.id;
        const newTimestamp = savedItinerary.created_at ?? body.created ?? new Date().toISOString();

        const query2 = `
          UPDATE users
          SET
            created_ids = array_append(COALESCE(created_ids, '{}'), $1),
            created_timestamps = array_append(COALESCE(created_timestamps, '{}'), $2)
          WHERE user_id = $3
          RETURNING user_id, created_ids, created_timestamps;
        `;

        const values2 = [newId, newTimestamp, body.owner_id];

        const result2 = await pool.query(query2, values2);

        return NextResponse.json(
            {
                message: 'Entry saved',
                data: savedItinerary,
                user: result2.rows[0],
            },
            { status: 201 }
        );

    } catch (error) {
        console.error('Database insert error:', error);
        return NextResponse.json(
            { error: 'Failed to save entry to database.' },
            { status: 500 }
        );
    }
}