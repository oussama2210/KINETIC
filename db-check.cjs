// Temporary DB connectivity check — delete after use
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

prisma.user
  .count()
  .then((count) => {
    console.log("DB CONNECT OK — user count:", count);
    return prisma.$disconnect();
  })
  .catch((e) => {
    console.log("DB FAILED:", e.message.split("\n")[0]);
    return prisma.$disconnect();
  });
