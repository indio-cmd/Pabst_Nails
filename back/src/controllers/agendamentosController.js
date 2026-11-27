
import {
  criarAgendamento,
  listarAgendamentos,
  alterarStatusAgendamento
} from '../services/agendamentosService.js'

function uuidValido(id) {
  return typeof id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

function dataValida(data) {
  if (typeof data !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return false
  }

  const dataConvertida = new Date(`${data}T00:00:00.000Z`)

  return !Number.isNaN(dataConvertida.getTime()) &&
    dataConvertida.toISOString().slice(0, 10) === data
}

function horarioValido(horario) {
  return typeof horario === 'string' &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(horario)
}

export async function cadastrarAgendamento(req, res) {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({
        mensagem: 'Envie os dados do agendamento em formato JSON'
      })
    }

    const { cliente_id, servico_id, data, horario } = req.body

    if (!cliente_id || !servico_id || !data || !horario) {
      return res.status(400).json({
        mensagem: 'Preencha todos os campos'
      })
    }

    if (!uuidValido(cliente_id) || !uuidValido(servico_id)) {
      return res.status(400).json({
        mensagem: 'ID da cliente ou do serviço inválido'
      })
    }

    if (!dataValida(data)) {
      return res.status(400).json({
        mensagem: 'Data inválida. Use AAAA-MM-DD'
      })
    }

    if (!horarioValido(horario)) {
      return res.status(400).json({
        mensagem: 'Horário inválido. Use HH:MM'
      })
    }

    const agendamento = await criarAgendamento({
      cliente_id,
      servico_id,
      data,
      horario
    })

    return res.status(201).json({
      mensagem: 'Agendamento realizado com sucesso',
      agendamento
    })

  } catch (error) {
    console.error('Erro ao cadastrar agendamento:', error)

    if (error.message === 'HORARIO_OCUPADO') {
      return res.status(409).json({
        mensagem: 'Esse horário já está ocupado'
      })
    }

    if (error.message === 'HORARIO_BLOQUEADO') {
      return res.status(409).json({
        mensagem: 'Esse horário está bloqueado'
      })
    }

    if (error.message === 'SERVICO_NAO_DISPONIVEL') {
      return res.status(400).json({
        mensagem: 'Serviço não encontrado ou inativo'
      })
    }

    if (error.message === 'HORARIO_PASSADO') {
  return res.status(400).json({
    mensagem: 'Esse horário já passou'
  })
}
  
    if (error.message === 'DATA_PASSADA') {
      return res.status(400).json({
        mensagem: 'Não é possível agendar em uma data passada'
      })
    }

    if (error.message === 'HORARIO_INVALIDO') {
      return res.status(400).json({
        mensagem: 'Horário inválido ou ultrapassa o limite do dia'
      })
    }

    if (error.message === 'HORARIO_FORA_DISPONIBILIDADE') {
      return res.status(400).json({
        mensagem: 'Esse horário está fora do funcionamento'
      })
    }

    if (error.message === 'DURACAO_INVALIDA') {
      return res.status(400).json({
        mensagem: 'A duração do serviço está inválida'
      })
    }

    return res.status(500).json({
      mensagem: 'Erro ao realizar agendamento'
    })
  }
}

export async function buscarAgendamentos(req, res) {
  try {
    const agendamentos = await listarAgendamentos()

    return res.status(200).json(agendamentos)

  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error)

    return res.status(500).json({
      mensagem: 'Erro ao buscar agendamentos'
    })
  }
}

export async function atualizarStatus(req, res) {
  try {
    const { id } = req.params

    if (!uuidValido(id)) {
      return res.status(400).json({
        mensagem: 'ID do agendamento inválido'
      })
    }

    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({
        mensagem: 'Envie o status em formato JSON'
      })
    }

    const { status } = req.body

    if (!['confirmado', 'cancelado'].includes(status)) {
      return res.status(400).json({
        mensagem: 'Status inválido'
      })
    }

    const agendamento = await alterarStatusAgendamento(id, status)

    return res.status(200).json({
      mensagem: 'Status atualizado com sucesso',
      agendamento
    })

  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error)

    if (error.message === 'AGENDAMENTO_NAO_ENCONTRADO') {
      return res.status(404).json({
        mensagem: 'Agendamento não encontrado'
      })
    }

    return res.status(500).json({
      mensagem: 'Erro ao atualizar agendamento'
    })
  }
}
