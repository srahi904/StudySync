// prisma/seed.ts
import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Admin user
  const adminPassword = await bcrypt.hash('Admin123!', 12)
  await prisma.user.upsert({
    where: { email: 'admin@studysync.ai' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@studysync.ai',
      password: adminPassword,
      role: UserRole.ADMIN,
      emailVerified: new Date(),
      onboarded: true,
    },
  })

  // Demo student
  const studentPassword = await bcrypt.hash('Student123!', 12)
  await prisma.user.upsert({
    where: { email: 'demo@studysync.ai' },
    update: {},
    create: {
      name: 'Demo Student',
      email: 'demo@studysync.ai',
      password: studentPassword,
      role: UserRole.USER,
      emailVerified: new Date(),
      onboarded: true,
      university: 'MIT',
      major: 'Computer Science',
      graduationYear: 2026,
      bio: 'Passionate about AI and machine learning.',
    },
  })

  console.log('✅ Seed complete!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
