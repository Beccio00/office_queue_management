// Use runtime require to avoid TypeScript compile-time module resolution
// errors when the generated Prisma client may not exist yet (tests/globalSetup
// creates/removes it). This prevents ts-jest from failing before globalSetup runs.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const GeneratedPrisma = require("../../generated/prisma");
const { PrismaClient } = GeneratedPrisma;

const prisma = new PrismaClient();

export default prisma;
