
import { listarServicos } from '../services/servicosService.js'

export async function buscarServicos(req, res) {
  try {
    const servicos = await listarServicos()

    return res.status(200).json(servicos)

  } catch (error) {
    console.error('Erro ao buscar serviços:', error)

    return res.status(500).json({
      mensagem: 'Erro ao buscar serviços'
    })
  }
}
