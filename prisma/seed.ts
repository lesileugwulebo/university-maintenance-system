import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Seed Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMINISTRATOR' },
    update: {},
    create: { name: 'ADMINISTRATOR' },
  });

  const officerRole = await prisma.role.upsert({
    where: { name: 'MAINTENANCE_OFFICER' },
    update: {},
    create: { name: 'MAINTENANCE_OFFICER' },
  });

  const studentRole = await prisma.role.upsert({
    where: { name: 'STUDENT_STAFF' },
    update: {},
    create: { name: 'STUDENT_STAFF' },
  });

  console.log('Roles seeded.');

  // 2. Seed Categories
  const categories = [
    'Faulty Electricity',
    'Damaged Furniture',
    'Leaking Pipes',
    'Internet Problems',
    'Classroom Equipment',
    'Hostel Maintenance',
  ];

  const dbCategories: Record<string, any> = {};
  for (const cat of categories) {
    dbCategories[cat] = await prisma.requestCategory.upsert({
      where: { name: cat },
      update: {},
      create: { name: cat },
    });
  }
  console.log('Categories seeded.');

  // 3. Seed Users
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('admin123', salt);
  const officerPassword = await bcrypt.hash('officer123', salt);
  const studentPassword = await bcrypt.hash('student123', salt);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@miva.edu' },
    update: {},
    create: {
      email: 'admin@miva.edu',
      username: 'admin',
      fullName: 'Principal Administrator',
      password: adminPassword,
      roleId: adminRole.id,
    },
  });

  const officerUser = await prisma.user.upsert({
    where: { email: 'officer@miva.edu' },
    update: {},
    create: {
      email: 'officer@miva.edu',
      username: 'officer',
      fullName: 'John Doe (Maintenance)',
      password: officerPassword,
      roleId: officerRole.id,
    },
  });

  const studentUser = await prisma.user.upsert({
    where: { email: 'student@miva.edu' },
    update: {},
    create: {
      email: 'student@miva.edu',
      username: 'student',
      fullName: 'Alice Smith (Student)',
      password: studentPassword,
      roleId: studentRole.id,
    },
  });

  console.log('Users seeded:');
  console.log(`- Admin: admin@miva.edu / admin123`);
  console.log(`- Officer: officer@miva.edu / officer123`);
  console.log(`- Student: student@miva.edu / student123`);

  // 4. Seed initial Service Requests
  const request1 = await prisma.request.create({
    data: {
      title: 'A/C unit leaking water in Lecture Room 3',
      description: 'The split unit air conditioner is constantly leaking water onto the floor, making it slippery and dangerous for lectures.',
      categoryId: dbCategories['Faulty Electricity'].id,
      priority: 'HIGH',
      status: 'PENDING',
      creatorId: studentUser.id,
      statusLogs: {
        create: {
          userId: studentUser.id,
          previousStatus: 'NONE',
          newStatus: 'PENDING',
          comment: 'Initial request submitted by student.',
        },
      },
    },
  });

  const request2 = await prisma.request.create({
    data: {
      title: 'Hostel Block B Wifi Router Offline',
      description: 'The router on the 2nd floor of Block B has no power light. No internet connection since last night.',
      categoryId: dbCategories['Internet Problems'].id,
      priority: 'CRITICAL',
      status: 'ASSIGNED',
      creatorId: studentUser.id,
      statusLogs: {
        createMany: {
          data: [
            {
              userId: studentUser.id,
              previousStatus: 'NONE',
              newStatus: 'PENDING',
              comment: 'Initial request submitted.',
            },
            {
              userId: adminUser.id,
              previousStatus: 'PENDING',
              newStatus: 'ASSIGNED',
              comment: 'Router offline reported. Assigned to John for immediate repair.',
            },
          ],
        },
      },
      assignments: {
        create: {
          officerId: officerUser.id,
          assignedById: adminUser.id,
        },
      },
    },
  });

  const request3 = await prisma.request.create({
    data: {
      title: 'Broken chair armrests in Seminar Room B',
      description: 'Three chairs in the back row have loose or broken wooden armrests. Need fixing or replacement.',
      categoryId: dbCategories['Damaged Furniture'].id,
      priority: 'LOW',
      status: 'COMPLETED',
      creatorId: studentUser.id,
      statusLogs: {
        createMany: {
          data: [
            {
              userId: studentUser.id,
              previousStatus: 'NONE',
              newStatus: 'PENDING',
              comment: 'Initial request.',
            },
            {
              userId: adminUser.id,
              previousStatus: 'PENDING',
              newStatus: 'ASSIGNED',
              comment: 'Assigned to maintenance team.',
            },
            {
              userId: officerUser.id,
              previousStatus: 'ASSIGNED',
              newStatus: 'COMPLETED',
              comment: 'Fixed with wood glue and screws. Chairs are back in order.',
            },
          ],
        },
      },
      assignments: {
        create: {
          officerId: officerUser.id,
          assignedById: adminUser.id,
        },
      },
    },
  });

  console.log('Sample requests seeded.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
