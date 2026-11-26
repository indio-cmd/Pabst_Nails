import { criarAgendamento } from '../services/agendamentosService.js'
import {
  listarAgendamentos
} from '../services/agendamentosService.js'


export async function cadastrarAgendamento(req, res) {
  try {
    const { cliente_id, servico_id, data, horario } = req.body

    if (!cliente_id || !servico_id || !data || !horario) {
      return res.status(400).json({
        mensagem: 'Preencha todos os campos'
      })
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return res.status(400).json({
        mensagem: 'Data inválida. Use AAAA-MM-DD'
      })
    }

    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(horario)) {
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
    console.log(error)

    if (error.message === 'HORARIO_OCUPADO') {
      return res.status(409).json({
        mensagem: 'Esse horário já está ocupado'
      })
    }

    if (error.message === 'SERVICO_NAO_DISPONIVEL') {
      return res.status(400).json({
        mensagem: 'Serviço não encontrado ou inativo'
      })
    }

    if (error.message === 'DATA_PASSADA') {
      return res.status(400).json({
        mensagem: 'Não é possível agendar em uma data passada'
      })
    }

    if (error.message === 'HORARIO_INVALIDO') {
      return res.status(400).json({
        mensagem: 'O horário ultrapassa o limite do dia'
      })
    }

    if (error.message === 'NAO_FOI_POSSIVEL_VALIDAR_HORARIO') {
      return res.status(500).json({
        mensagem: 'Não foi possível verificar os horários existentes'
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
    console.log(error)

    return res.status(500).json({
      mensagem: 'Erro ao buscar agendamentos'
    })
  }
}