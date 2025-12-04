const { Pool } = require("pg");
const bcrypt = require("bcrypt");

let connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Configure it in your environment before running the seed script.");
}

// Remove sslmode/sslaccept from URL so we can control SSL via Pool options
connectionString = connectionString
  .replace(/[?&]sslmode=[^&]*/gi, "")
  .replace(/[?&]sslaccept=[^&]*/gi, "")
  .replace(/\?$/, ""); // clean trailing ? if params were removed

// Create a pg Pool with SSL configured to accept self-signed certs (Supabase)
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function main() {
  const client = await pool.connect();
  console.log("[seed] Successfully connected to database.");

  try {
    const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";
    const adminFullName = process.env.SEED_ADMIN_FULL_NAME || "Seed Admin";
    const tenantName = process.env.SEED_TENANT_NAME || "Default Tenant";
    const tenantMonthlyQuota = Number(process.env.SEED_TENANT_MONTHLY_QUOTA || "10000");

    if (!process.env.SEED_ADMIN_PASSWORD) {
      console.warn(
        "[seed] SEED_ADMIN_PASSWORD is not set. Using a default password (ChangeMe123!) suitable only for local development. Set SEED_ADMIN_PASSWORD in production."
      );
    }

    const now = new Date();
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    // Upsert tenant
    await client.query(
      `
      INSERT INTO tenants (id, email, "fullName", plan, status, "monthlyQuota", "updatedAt", "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
      ON CONFLICT (email) DO UPDATE SET
        "fullName" = EXCLUDED."fullName",
        "updatedAt" = EXCLUDED."updatedAt"
      `,
      ["tenant-default", adminEmail, tenantName, "FREE", "TRIAL", tenantMonthlyQuota, now]
    );

    // Upsert admin_users
    await client.query(
      `
      INSERT INTO admin_users (id, email, "passwordHash", role, "fullName", "updatedAt", "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6, $6)
      ON CONFLICT (email) DO UPDATE SET
        "passwordHash" = EXCLUDED."passwordHash",
        role = EXCLUDED.role,
        "fullName" = EXCLUDED."fullName",
        "updatedAt" = EXCLUDED."updatedAt"
      `,
      ["admin-default", adminEmail, passwordHash, "SUPER_ADMIN", adminFullName, now]
    );

    console.log("[seed] Default admin and tenant have been created or updated.");
    console.log(`[seed] Admin email: ${adminEmail}`);
  } finally {
    client.release();
  }
}

main()
  .catch((error) => {
    console.error("[seed] Error while seeding database:", error);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
