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
}

export async function POST(request: Request) {
    try {
        const body: FormPayload = await request.json();

        // Basic validation
        // if (!body.name || !body.description) {
        //     return NextResponse.json(
        //         { error: 'Name and description are required.' },
        //         { status: 400 }
        //     );
        // }

        // Default to current time if no timestamp was provided
        //const eventTime = body.timestamp ? new Date(body.timestamp) : new Date();

        const query = `
      INSERT INTO itineraries (key, name, description, location, created_at, 
      last_edited_at, body, timeframe, stops, published)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10)
      RETURNING *;
    `;
        const values = [body.id, body.title, body.description, body.location,
        body.created, body.last_updated, "", body.travel_date, JSON.stringify(body.stops || []), body.published];

        const result = await pool.query(query, values);

        return NextResponse.json(
            { message: 'Entry saved', data: result.rows[0] },
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