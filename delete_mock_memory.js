import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const result = await prisma.orgMemory.deleteMany({
    where: {
      OR: [
        { title: 'Decision Captured' },
        { title: 'Discussion Summary' }
      ]
    }
  });
  console.log(`Deleted ${result.count} mock memory records.`);
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
