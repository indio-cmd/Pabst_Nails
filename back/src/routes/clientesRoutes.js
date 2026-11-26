import { Router } from 'express'
import { criarCliente } from '../controllers/clientesController.js'

const router = Router()

router.post('/', criarCliente)

export default router