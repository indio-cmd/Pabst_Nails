import { Router } from 'express'

import {
  buscarBloqueios,
  cadastrarBloqueio,
  excluirBloqueio
} from '../controllers/horariosBloqueadosController.js'

import { verificarAdmin } from '../middlewares/authMiddleware.js'

const router = Router()

router.get('/', verificarAdmin, buscarBloqueios)

router.post('/', verificarAdmin, cadastrarBloqueio)

router.delete('/:id', verificarAdmin, excluirBloqueio)

export default router