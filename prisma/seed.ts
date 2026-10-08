import { PrismaClient, RoleType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  await prisma.kaizen.deleteMany()
  await prisma.dailyItem.deleteMany()
  await prisma.dailyReport.deleteMany()
  await prisma.user.deleteMany()
  await prisma.kpiDefinition.deleteMany()
  await prisma.division.deleteMany()
  await prisma.outlet.deleteMany()

  const outlets = await Promise.all([
    prisma.outlet.create({ data: { name: 'Outlet Kuta', location: 'Bali' } }),
    prisma.outlet.create({ data: { name: 'Outlet Ubud', location: 'Bali' } }),
    prisma.outlet.create({ data: { name: 'Outlet Seminyak', location: 'Bali' } }),
    prisma.outlet.create({ data: { name: 'Outlet Canggu', location: 'Bali' } }),
    prisma.outlet.create({ data: { name: 'Outlet Sanur', location: 'Bali' } }),
  ])

  const divisions = await Promise.all([
    prisma.division.create({ data: { name: 'HR' } }),
    prisma.division.create({ data: { name: 'Product' } }),
    prisma.division.create({ data: { name: 'Marketing' } }),
    prisma.division.create({ data: { name: 'Finance' } }),
    prisma.division.create({ data: { name: 'Operation' } }),
  ])

  const marketingDiv = divisions.find(d => d.name === 'Marketing')!

  await prisma.kpiDefinition.createMany({
    data: [
      { divisionId: marketingDiv.id, name: 'Total Check (TC)', measureUnit: 'Pengunjung' },
      { divisionId: marketingDiv.id, name: 'Google Maps Rating', measureUnit: 'Bintang' }
    ]
  })

  const hashedPassword = await bcrypt.hash('password123', 10)

  await prisma.user.create({
    data: {
      name: 'Owner BAMBOOBERRY',
      email: 'owner@bambooberry.com',
      password: hashedPassword,
      role: RoleType.OWNER,
      outlets: { connect: outlets.map(o => ({ id: o.id })) }
    }
  })

  await prisma.user.create({
    data: {
      name: 'Manager Marketing',
      email: 'manager.mkt@bambooberry.com',
      password: hashedPassword,
      role: RoleType.MANAGER,
      divisionId: marketingDiv.id,
      outlets: { connect: [{ id: outlets[0].id }, { id: outlets[2].id }] }
    }
  })

  await prisma.user.create({
    data: {
      name: 'Staff Kuta',
      email: 'staff.kuta@bambooberry.com',
      password: hashedPassword,
      role: RoleType.STAFF,
      divisionId: marketingDiv.id,
      outlets: { connect: [{ id: outlets[0].id }] }
    }
  })
}

main().catch(console.error).finally(() => prisma.$disconnect())
