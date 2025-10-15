import { execSync } from "child_process";
import { join } from "path";
import fs from "fs";

const testDb = join(__dirname, "test.db");
process.env.DATABASE_URL = `file:${testDb}`;

if (fs.existsSync(testDb)) fs.unlinkSync(testDb);

console.log("Creating test DB...");
execSync("npx prisma db push", { stdio: "inherit" });

// run seed if available
try {
  execSync("npm run seed", { stdio: "inherit" });
} catch (e) {
  console.log("No seed script or seed failed (ok for tests)");
}
