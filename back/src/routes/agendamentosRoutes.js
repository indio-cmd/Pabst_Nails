import { Router } from 'express'

import {
  cadastrarAgendamento,
  buscarAgendamentos
} from '../controllers/agendamentosController.js'

import { verificarAdmin } from '../middlewares/authMiddleware.js'

const router = Router()

router.get('/', verificarAdmin, buscarAgendamentos)
router.post('/', cadastrarAgendamento)

export default router