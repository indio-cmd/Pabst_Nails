
import { cadastrarCliente } from '../services/clientesService.js'

export async function criarCliente(req, res) {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({
        mensagem: 'Envie os dados em formato JSON'
      })
    }

    const { nome, telefone } = req.body

    if (!nome || !telefone) {
      return res.status(400).json({
        mensagem: 'Nome e telefone são obrigatórios'
      })
    }

    if (typeof nome !== 'string' || typeof telefone !== 'string') {
      return res.status(400).json({
        mensagem: 'Nome e telefone devem ser textos'
      })
    }

    const nomeLimpo = nome.trim()
    const telefoneLimpo = telefone.trim()

    if (nomeLimpo.length < 2 || nomeLimpo.length > 100) {
      return res.status(400).json({
        mensagem: 'O nome deve ter entre 2 e 100 caracteres'
      })
    }

    const quantidadeDigitos = telefoneLimpo.replace(/\D/g, '').length

    if (
      !/^[+\d\s()-]+$/.test(telefoneLimpo) ||
      quantidadeDigitos < 10 ||
      quantidadeDigitos > 15
    ) {
      return res.status(400).json({
        mensagem: 'Informe um telefone válido'
      })
    }

    const cliente = await cadastrarCliente(
      nomeLimpo,
      telefoneLimpo
    )

    return res.status(201).json({
      mensagem: 'Cliente cadastrado com sucesso',
      cliente
    })

  } catch (error) {
    console.error('Erro ao cadastrar cliente:', error)
    
if (error.code === '23505') {
  return res.status(409).json({
    mensagem: 'Esse telefone já está cadastrado'
  })
}

    return res.status(500).json({
      mensagem: 'Erro ao cadastrar cliente'
    })
  }
}
