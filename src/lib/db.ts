import { Pool } from "pg";

let connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Configure it in your environment.");
}

// Remove sslmode/sslaccept from URL so we control SSL via Pool options
connectionString = connectionString
  .replace(/[?&]sslmode=[^&]*/gi, "")
  .replace(/[?&]sslaccept=[^&]*/gi, "")
  .replace(/\?$/, "");

// Create pg Pool with SSL configured to accept self-signed certs (Supabase)
export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});
