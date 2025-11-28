require('dotenv').config();
const prisma = require('./src/config/prisma');

async function test() {
  try {
    console.log("Connecting...");
    const count = await prisma.user.count();
    console.log("User count:", count);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

test();
