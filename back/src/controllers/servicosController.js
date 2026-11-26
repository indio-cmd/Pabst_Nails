import { listarServicos } from '../services/servicosService.js'

export async function buscarServicos(req, res) {
  try {
    const servicos = await listarServicos()

    res.status(200).json(servicos)
  } catch (error) {
    res.status(500).json({
      mensagem: 'Erro ao buscar serviços',
      erro: error.message
    })
  }
}