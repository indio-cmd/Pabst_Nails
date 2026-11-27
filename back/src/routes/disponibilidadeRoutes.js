import { Router } from 'express'

import {
  buscarDisponibilidade,
  atualizarDisponibilidade
} from '../controllers/disponibilidadeController.js'

import { verificarAdmin } from '../middlewares/authMiddleware.js'

const router = Router()

router.get('/', verificarAdmin, buscarDisponibilidade)

router.patch('/:id', verificarAdmin, atualizarDisponibilidade)

export default router