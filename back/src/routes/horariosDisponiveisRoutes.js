import { Router } from 'express'

import {
  listarHorariosDisponiveis
} from '../controllers/horariosDisponiveisController.js'

const router = Router()

router.get('/', listarHorariosDisponiveis)

export default router