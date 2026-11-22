import { NextResponse } from "next/server";
import pool from "../../../server/db";

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required." },
                { status: 400 }
            );
        }

        const result = await pool.query(
            `SELECT user_id, password FROM users WHERE user_email = $1 LIMIT 1;`,
            [email]
        );

        const user = result.rows[0];

        if (!user || user.password !== password) {
            return NextResponse.json(
                { error: "Invalid email or password." },
                { status: 401 }
            );
        }

        return NextResponse.json({ user_id: user.user_id }, { status: 200 });
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { error: "Failed to log in." },
            { status: 500 }
        );
    }
}