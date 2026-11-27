
import {
  listarDisponibilidade,
  alterarDisponibilidade
} from '../services/disponibilidadeService.js'

function uuidValido(id) {
  return typeof id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

function horarioValido(horario) {
  return typeof horario === 'string' &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(horario)
}

export async function buscarDisponibilidade(req, res) {
  try {
    const disponibilidade = await listarDisponibilidade()

    return res.status(200).json(disponibilidade)

  } catch (error) {
    console.error('Erro ao buscar disponibilidade:', error)

    return res.status(500).json({
      mensagem: 'Erro ao buscar disponibilidade'
    })
  }
}

export async function atualizarDisponibilidade(req, res) {
  try {
    const { id } = req.params

    if (!uuidValido(id)) {
      return res.status(400).json({
        mensagem: 'ID da disponibilidade inválido'
      })
    }

    if (
      !req.body ||
      typeof req.body !== 'object' ||
      Array.isArray(req.body)
    ) {
      return res.status(400).json({
        mensagem: 'Envie os dados em formato JSON'
      })
    }

    const camposPermitidos = [
      'horario_inicio',
      'horario_fim',
      'ativo'
    ]

    const camposRecebidos = Object.keys(req.body)

    if (camposRecebidos.some(campo => !camposPermitidos.includes(campo))) {
      return res.status(400).json({
        mensagem: 'Existem campos não permitidos'
      })
    }

    const { horario_inicio, horario_fim, ativo } = req.body

    if (camposRecebidos.length === 0) {
      return res.status(400).json({
        mensagem: 'Informe o que deseja alterar'
      })
    }

    if (
      horario_inicio === undefined &&
      horario_fim === undefined &&
      ativo === undefined
    ) {
      return res.status(400).json({
        mensagem: 'Informe o que deseja alterar'
      })
    }

    if (
      horario_inicio !== undefined &&
      !horarioValido(horario_inicio)
    ) {
      return res.status(400).json({
        mensagem: 'Horário inicial inválido. Use HH:MM'
      })
    }

    if (
      horario_fim !== undefined &&
      !horarioValido(horario_fim)
    ) {
      return res.status(400).json({
        mensagem: 'Horário final inválido. Use HH:MM'
      })
    }

    if (ativo !== undefined && typeof ativo !== 'boolean') {
      return res.status(400).json({
        mensagem: 'O campo ativo deve ser true ou false'
      })
    }

    const disponibilidade = await alterarDisponibilidade(id, {
      horario_inicio,
      horario_fim,
      ativo
    })

    return res.status(200).json({
      mensagem: 'Disponibilidade atualizada com sucesso',
      disponibilidade
    })

  } catch (error) {
    console.error('Erro ao atualizar disponibilidade:', error)

    if (error.message === 'DISPONIBILIDADE_NAO_ENCONTRADA') {
      return res.status(404).json({
        mensagem: 'Disponibilidade não encontrada'
      })
    }

    if (
      error.message === 'HORARIO_INVALIDO' ||
      error.message === 'INTERVALO_INVALIDO' ||
      error.message === 'NENHUMA_ALTERACAO'
    ) {
      return res.status(400).json({
        mensagem: 'Horários inválidos ou alteração não permitida'
      })
    }

    return res.status(500).json({
      mensagem: 'Erro ao atualizar disponibilidade'
    })
  }
}
