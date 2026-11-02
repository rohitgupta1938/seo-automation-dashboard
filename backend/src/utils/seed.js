// src/utils/seed.js
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { prisma } = require('../config/database');

async function seed() {
  console.log('🌱 Seeding database...');

  // Admin user
  const adminPassword = await bcrypt.hash('Admin@1234', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@seodashboard.com' },
    update: {},
    create: { email: 'admin@seodashboard.com', password: adminPassword, name: 'Admin User', role: 'ADMIN' },
  });
  console.log('✅ Admin created:', admin.email);

  // Demo client
  const clientPassword = await bcrypt.hash('Client@1234', 12);
  const clientUser = await prisma.user.upsert({
    where: { email: 'demo@dentalclinic.com' },
    update: {},
    create: {
      email: 'demo@dentalclinic.com',
      password: clientPassword,
      name: 'Dr. Sharma',
      role: 'CLIENT',
      client: {
        create: { companyName: 'Sharma Dental Clinic', phone: '+91 98765 43210', address: 'FC Road, Pune, Maharashtra' },
      },
    },
    include: { client: true },
  });
  console.log('✅ Demo client created:', clientUser.email);

  // Demo website
  if (clientUser.client) {
    const website = await prisma.website.upsert({
      where: { id: 'demo-website-001' },
      update: {},
      create: {
        id: 'demo-website-001',
        clientId: clientUser.client.id,
        url: 'https://example-dental-clinic.com',
        name: 'Sharma Dental Clinic',
        businessType: 'Dental Clinic',
        city: 'Pune',
        state: 'Maharashtra',
        targetKeywords: ['dental clinic pune', 'best dentist pune', 'tooth extraction pune'],
      },
    });
    console.log('✅ Demo website created:', website.url);
  }

  console.log('\n🎉 Seed complete!');
  console.log('Admin login: admin@seodashboard.com / Admin@1234');
  console.log('Client login: demo@dentalclinic.com / Client@1234');

  await prisma.$disconnect();
}

seed().catch(e => { console.error(e); process.exit(1); });
