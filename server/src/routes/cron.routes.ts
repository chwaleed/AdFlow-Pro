import { Router } from 'express'
import { triggerJob } from '../controllers/cron.controller.js'

const router = Router()

router.post('/run/:job', triggerJob)

export default router
