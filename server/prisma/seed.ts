import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seed...");

  // Clear existing data
  await prisma.ticket.deleteMany();
  await prisma.counterService.deleteMany();
  await prisma.counter.deleteMany();
  await prisma.service.deleteMany();

  // Create services
  const depositService = await prisma.service.create({
    data: {
      id: 1,
      tag: "D",
      name: "Money Deposit",
    },
  });

  const shippingService = await prisma.service.create({
    data: {
      id: 2,
      tag: "S",
      name: "Package Shipping",
    },
  });

  const accountService = await prisma.service.create({
    data: {
      id: 3,
      tag: "A",
      name: "Account Management",
    },
  });

  console.log("Services created:", {
    deposit: depositService.id,
    shipping: shippingService.id,
    account: accountService.id,
  });

  // Create counters
  const counter1 = await prisma.counter.create({
    data: {
      id: 1,
      name: 'Counter 1'
    }
  });

  const counter2 = await prisma.counter.create({
    data: {
      id: 2,
      name: 'Counter 2'
    }
  });

  const counter3 = await prisma.counter.create({
    data: {
      id: 3,
      name: 'Counter 3'
    }
  });

  console.log("Counters created:", {
    counter1: counter1.id,
    counter2: counter2.id,
    counter3: counter3.id,
  });

  // Assign services to counters

  // Counter 1: DEPOSIT and ACCOUNT
  await prisma.counterService.create({
    data: {
      counterId: counter1.id,
      serviceId: depositService.id,
    },
  });
  await prisma.counterService.create({
    data: {
      counterId: counter1.id,
      serviceId: accountService.id,
    },
  });

  // Counter 2: SHIPPING and DEPOSIT
  await prisma.counterService.create({
    data: {
      counterId: counter2.id,
      serviceId: shippingService.id,
    },
  });
  await prisma.counterService.create({
    data: {
      counterId: counter2.id,
      serviceId: depositService.id,
    },
  });

  // Counter 3: ACCOUNT and SHIPPING
  await prisma.counterService.create({
    data: {
      counterId: counter3.id,
      serviceId: accountService.id,
    },
  });
  await prisma.counterService.create({
    data: {
      counterId: counter3.id,
      serviceId: shippingService.id,
    },
  });

  console.log("Service assignments completed!");

  console.log("\nDatabase seed completed successfully!");
  console.log("\nSummary:");
  console.log("  - 3 Services created");
  console.log("  - 3 Counters created");
  console.log("  - Services assigned to counters");
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
