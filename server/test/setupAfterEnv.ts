import prisma from "../src/services/prismaClient";

// Ensure prisma disconnects after all tests so the DB file is not locked on Windows
afterAll(async () => {
  try {
    await prisma.$disconnect();
  } catch (err) {
    // ignore
    // eslint-disable-next-line no-console
    console.warn("prisma disconnect failed during teardown", err);
  }
});
