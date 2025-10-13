import { PrismaClient } from '@prisma/client';

// Single PrismaClient instance for the whole app
const prisma = new PrismaClient();

export default prisma;
