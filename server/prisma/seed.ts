import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  await prisma.ticket.deleteMany();
  await prisma.counterService.deleteMany();
  await prisma.counter.deleteMany();
  await prisma.service.deleteMany();

  // Create services
  console.log('📋 Creating services...');
  const depositService = await prisma.service.create({
    data: {
      tag: 'DEPOSIT',
      name: 'Money Deposit',
      avgServiceTime: 5
    }
  });

  const shippingService = await prisma.service.create({
    data: {
      tag: 'SHIPPING',
      name: 'Package Shipping',
      avgServiceTime: 10
    }
  });

  const accountService = await prisma.service.create({
    data: {
      tag: 'ACCOUNT',
      name: 'Account Management',
      avgServiceTime: 15
    }
  });

  console.log('✅ Services created:', {
    deposit: depositService.id,
    shipping: shippingService.id,
    account: accountService.id
  });

  // Create counters
  console.log('🪟 Creating counters...');
  const counter1 = await prisma.counter.create({
    data: {
      name: 'Counter 1',
      isActive: true
    }
  });

  const counter2 = await prisma.counter.create({
    data: {
      name: 'Counter 2',
      isActive: true
    }
  });

  const counter3 = await prisma.counter.create({
    data: {
      name: 'Counter 3',
      isActive: true
    }
  });

  console.log('✅ Counters created:', {
    counter1: counter1.id,
    counter2: counter2.id,
    counter3: counter3.id
  });

  // Assign services to counters
  console.log('🔗 Assigning services to counters...');
  
  // Counter 1: DEPOSIT and ACCOUNT
  await prisma.counterService.create({
    data: {
      counterId: counter1.id,
      serviceId: depositService.id
    }
  });
  await prisma.counterService.create({
    data: {
      counterId: counter1.id,
      serviceId: accountService.id
    }
  });

  // Counter 2: SHIPPING and DEPOSIT
  await prisma.counterService.create({
    data: {
      counterId: counter2.id,
      serviceId: shippingService.id
    }
  });
  await prisma.counterService.create({
    data: {
      counterId: counter2.id,
      serviceId: depositService.id
    }
  });

  // Counter 3: ACCOUNT and SHIPPING
  await prisma.counterService.create({
    data: {
      counterId: counter3.id,
      serviceId: accountService.id
    }
  });
  await prisma.counterService.create({
    data: {
      counterId: counter3.id,
      serviceId: shippingService.id
    }
  });

  console.log('✅ Service assignments completed!');
  
  console.log('\n🎉 Database seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log('  - 3 Services created');
  console.log('  - 3 Counters created');
  console.log('  - Services assigned to counters');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

