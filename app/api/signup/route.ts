import { NextResponse } from 'next/server';
// import pool from '@/server/db';
import pool from '../../../server/db';

interface FormPayload {
    user_id: string;
    username: string;
    user_email: string;
    created_at: string;
    password: string;
}

export async function POST(request: Request) {
    try {
        const body: FormPayload = await request.json();

        const query = `
      INSERT INTO users (user_id, username, user_email, created_at, password)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
        const values = [body.user_id, body.username, body.user_email,
        body.created_at, body.password];

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