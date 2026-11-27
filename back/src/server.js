import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import servicosRoutes from './routes/servicosRoutes.js'
import clientesRoutes from './routes/clientesRoutes.js'
import agendamentosRoutes from './routes/agendamentosRoutes.js'
import authRoutes from './routes/authRoutes.js'
import disponibilidadeRoutes from './routes/disponibilidadeRoutes.js'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

app.use('/disponibilidade', disponibilidadeRoutes)
app.use('/auth', authRoutes)
app.use('/agendamentos', agendamentosRoutes)
app.use('/clientes', clientesRoutes)
app.use('/servicos', servicosRoutes)
app.get('/', (req, res) => {
  res.json({ mensagem: 'Backend funcionando!' })
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
})