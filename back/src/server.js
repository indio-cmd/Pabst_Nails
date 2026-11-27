
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'

import servicosRoutes from './routes/servicosRoutes.js'
import clientesRoutes from './routes/clientesRoutes.js'
import agendamentosRoutes from './routes/agendamentosRoutes.js'
import authRoutes from './routes/authRoutes.js'
import disponibilidadeRoutes from './routes/disponibilidadeRoutes.js'
import horariosBloqueadosRoutes from './routes/horariosBloqueadosRoutes.js'
import horariosDisponiveisRoutes from './routes/horariosDisponiveisRoutes.js'

const app = express()

const PORT = process.env.PORT || 3000

const origensPermitidas = (
  process.env.FRONTEND_URL || 'http://localhost:5173'
).split(',').map(origem => origem.trim())

app.use(helmet())

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origensPermitidas.includes(origin)) {
      return callback(null, true)
    }

    return callback(new Error('ORIGEM_NAO_PERMITIDA'))
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json({ limit: '10kb' }))

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    mensagem: 'Muitas tentativas de login. Tente novamente mais tarde.'
  }
})

const cadastroLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    mensagem: 'Muitas tentativas. Tente novamente mais tarde.'
  }
})

app.post('/auth/login', loginLimiter)
app.post('/clientes', cadastroLimiter)
app.post('/agendamentos', cadastroLimiter)

app.get('/', (req, res) => {
  res.json({
    mensagem: 'Backend Pabst Nails funcionando!'
  })
})

app.use('/servicos', servicosRoutes)
app.use('/clientes', clientesRoutes)
app.use('/agendamentos', agendamentosRoutes)
app.use('/auth', authRoutes)
app.use('/disponibilidade', disponibilidadeRoutes)
app.use('/horarios-bloqueados', horariosBloqueadosRoutes)
app.use('/horarios-disponiveis', horariosDisponiveisRoutes)

app.use((req, res) => {
  return res.status(404).json({
    mensagem: 'Rota não encontrada'
  })
})

app.use((error, req, res, next) => {
  if (error.message === 'ORIGEM_NAO_PERMITIDA') {
    return res.status(403).json({
      mensagem: 'Origem não permitida'
    })
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      mensagem: 'JSON inválido'
    })
  }

  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      mensagem: 'Requisição muito grande'
    })
  }

  console.error(error)

  return res.status(500).json({
    mensagem: 'Erro interno do servidor'
  })
})

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
})
