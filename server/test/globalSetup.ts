import { execSync } from "child_process";
import { join } from "path";
import fs from "fs";

const testDir = join(__dirname);
const testDb = join(testDir, "test.db");

// set DATABASE_URL for any child processes
process.env.DATABASE_URL = `file:${testDb}`;

if (fs.existsSync(testDb)) {
  try {
    fs.unlinkSync(testDb);
  } catch (e) {
    /* ignore */
  }
}

console.log("globalSetup: creating test DB and running prisma db push...");
execSync("npx prisma db push", {
  stdio: "inherit",
  cwd: join(__dirname, ".."),
});

try {
  console.log("globalSetup: running seed...");
  execSync("npm run seed", { stdio: "inherit", cwd: join(__dirname, "..") });
} catch (e) {
  console.log("globalSetup: seed failed or not present, continuing");
}

export default async function globalSetup() {
  // Jest requires a default export, but work is already done above.
}
