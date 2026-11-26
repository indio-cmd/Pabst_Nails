import { cadastrarCliente } from '../services/clientesService.js'

export async function criarCliente(req, res) {
  try {
    const { nome, telefone } = req.body

    if (!nome || !telefone) {
      return res.status(400).json({
        mensagem: 'Nome e telefone são obrigatórios'
      })
    }

    const cliente = await cadastrarCliente(
      nome.trim(),
      telefone.trim()
    )

    return res.status(201).json({
      mensagem: 'Cliente cadastrado com sucesso',
      cliente
    })

  } catch (error) {
    console.log(error)

    return res.status(500).json({
      mensagem: 'Erro ao cadastrar cliente'
    })
  }
}