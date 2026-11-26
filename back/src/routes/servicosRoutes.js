import { Router } from 'express'
import { buscarServicos } from '../controllers/servicosController.js'

const router = Router()

router.get('/', buscarServicos)

export default router