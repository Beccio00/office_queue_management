import { PrismaClient } from '../../generated/prisma';

// Single PrismaClient instance for the whole app
const prisma = new PrismaClient();

export default prisma;
