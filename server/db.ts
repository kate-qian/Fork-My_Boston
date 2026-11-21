import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.NEXT_PUBLIC_DATABASE_URL,
    ssl: {
        rejectUnauthorized: false, // Required for Tiger Data cloud SSL connections
    },
});

export default pool;