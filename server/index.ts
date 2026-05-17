import 'dotenv/config'
import app from './src/app.js'
import { connectDB } from './src/config/db.js'
import { env } from './src/config/env.js'
import { registerCronJobs } from './src/jobs/jobs.js'

async function start() {
  await connectDB()
  registerCronJobs()
  app.listen(env.PORT, () => {
    console.log(`Server running on http://localhost:${env.PORT} [${env.NODE_ENV}]`)
  })
}

start().catch((err) => {
  console.error('Failed to start:', err)
  process.exit(1)
})
