// import 'dotenv/config'
// import { defineConfig, env } from 'prisma/config'

// export default defineConfig({
//   // the main entry for schema
//   schema: 'prisma/models',
//   // where migrations should be generated
//   // what script to run for "prisma db seed"
//   migrations: {
//     path: 'prisma/migrations',
//     seed: 'tsx prisma/seed.ts',
//   },

//   datasource: {
//     url: env('DIRECT_DATABASE_URL'),
//   },
// })


import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/models',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // Prisma 7 uses this for CLI commands like 'db pull' and 'migrate'
    url: env('DIRECT_DATABASE_URL'),
  },
})