import { Router } from 'express'

import {
  cadastrarAgendamento,
  buscarAgendamentos,
  atualizarStatus
} from '../controllers/agendamentosController.js'

import { verificarAdmin } from '../middlewares/authMiddleware.js'

const router = Router()

router.get('/', verificarAdmin, buscarAgendamentos)

router.post('/', cadastrarAgendamento)

router.patch('/:id/status', verificarAdmin, atualizarStatus)

export default router