import bcrypt from "bcryptjs";
import { createPrisma } from "../src/lib/prisma";

const db = createPrisma();

function env(key: string): string {
  const value = process.env[key]?.trim();
  if (!value) throw new Error(`${key} is required`);
  return value;
}

/**
 * First-install bootstrap: creates exactly one School and one ADMIN account.
 * No students, no teachers, no groups, no invoices — the database stays blank.
 *
 * Idempotent:
 *   - school + admin already present  -> nothing to do
 *   - school present, no admin        -> creates the admin only
 *   - nothing present                 -> creates the school then the admin
 *
 * Usage:
 *   npm run db:bootstrap
 *
 * Required env vars:
 *   SCHOOL_NAME, ADMIN_EMAIL, ADMIN_PASSWORD
 * Optional:
 *   SCHOOL_EMAIL, SCHOOL_PHONE, SCHOOL_ADDRESS, ADMIN_NAME
 */
async function main() {
  const password = env("ADMIN_PASSWORD");
  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters");
  }

  const adminEmail = env("ADMIN_EMAIL").toLowerCase();

  let school = await db.school.findFirst({ select: { id: true, name: true } });

  if (!school) {
    school = await db.school.create({
      data: {
        name: env("SCHOOL_NAME"),
        email: process.env.SCHOOL_EMAIL?.trim() || null,
        phone: process.env.SCHOOL_PHONE?.trim() || null,
        address: process.env.SCHOOL_ADDRESS?.trim() || null,
      },
      select: { id: true, name: true },
    });
    console.log(`School created: #${school.id} (${school.name})`);
  } else {
    console.log(`School already exists: #${school.id} (${school.name})`);
  }

  const admin = await db.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true, email: true },
  });

  if (admin) {
    console.log(`Admin already exists: #${admin.id} (${admin.email}) — nothing to do.`);
    return;
  }

  const emailTaken = await db.user.findUnique({ where: { email: adminEmail }, select: { id: true } });
  if (emailTaken) {
    throw new Error(`A user already exists with email ${adminEmail} but is not an ADMIN`);
  }

  const created = await db.user.create({
    data: {
      schoolId: school.id,
      name: process.env.ADMIN_NAME?.trim() || "Administrateur",
      email: adminEmail,
      password: await bcrypt.hash(password, 10),
      role: "ADMIN",
    },
  });

  await db.auditLog.create({
    data: {
      schoolId: school.id,
      userId: created.id,
      action: "BOOTSTRAP",
      entity: "School",
      entityId: school.id,
      details: { source: "scripts/bootstrap.ts" },
    },
  });

  console.log(`Admin created: #${created.id} (${created.email})`);
  console.log("Database is blank: 0 student, 0 teacher, 0 group, 0 invoice.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
