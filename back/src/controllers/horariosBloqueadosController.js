
import {
  listarBloqueios,
  criarBloqueio,
  removerBloqueio
} from '../services/horariosBloqueadosService.js'

function uuidValido(id) {
  return typeof id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

function dataValida(data) {
  if (
    typeof data !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(data)
  ) {
    return false
  }

  const dataConvertida = new Date(`${data}T00:00:00.000Z`)

  return (
    !Number.isNaN(dataConvertida.getTime()) &&
    dataConvertida.toISOString().slice(0, 10) === data
  )
}

function horarioValido(horario) {
  return typeof horario === 'string' &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(horario)
}

function converterHorario(horario) {
  const [horas, minutos] = horario.split(':').map(Number)

  return horas * 60 + minutos
}

export async function buscarBloqueios(req, res) {
  try {
    const bloqueios = await listarBloqueios()

    return res.status(200).json(bloqueios)

  } catch (error) {
    console.error('Erro ao buscar bloqueios:', error)

    return res.status(500).json({
      mensagem: 'Erro ao buscar bloqueios'
    })
  }
}

export async function cadastrarBloqueio(req, res) {
  try {
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
      'data',
      'horario_inicio',
      'horario_fim',
      'motivo',
      'dia_inteiro'
    ]

    const camposRecebidos = Object.keys(req.body)

    if (camposRecebidos.some(campo => !camposPermitidos.includes(campo))) {
      return res.status(400).json({
        mensagem: 'Existem campos não permitidos'
      })
    }

    const {
      data,
      horario_inicio,
      horario_fim,
      motivo,
      dia_inteiro
    } = req.body

    if (!dataValida(data)) {
      return res.status(400).json({
        mensagem: 'Informe uma data válida no formato AAAA-MM-DD'
      })
    }

    if (
      dia_inteiro !== undefined &&
      typeof dia_inteiro !== 'boolean'
    ) {
      return res.status(400).json({
        mensagem: 'O campo dia_inteiro deve ser true ou false'
      })
    }

    if (
      motivo !== undefined &&
      motivo !== null &&
      typeof motivo !== 'string'
    ) {
      return res.status(400).json({
        mensagem: 'O motivo deve ser um texto'
      })
    }

    let inicio
    let fim

    if (dia_inteiro === true) {
      if (
        horario_inicio !== undefined ||
        horario_fim !== undefined
      ) {
        return res.status(400).json({
          mensagem: 'Informe o dia inteiro ou um período, não ambos'
        })
      }

      inicio = '00:00'
      fim = '23:59:59'

    } else {
      if (
        !horarioValido(horario_inicio) ||
        !horarioValido(horario_fim)
      ) {
        return res.status(400).json({
          mensagem: 'Informe horários válidos no formato HH:MM'
        })
      }

      if (
        converterHorario(horario_inicio) >=
        converterHorario(horario_fim)
      ) {
        return res.status(400).json({
          mensagem: 'O horário final deve ser posterior ao inicial'
        })
      }

      inicio = horario_inicio
      fim = horario_fim
    }

    const bloqueio = await criarBloqueio({
      data,
      horario_inicio: inicio,
      horario_fim: fim,
      motivo: motivo?.trim() || null
    })

    return res.status(201).json({
      mensagem: 'Horário bloqueado com sucesso',
      bloqueio
    })

  } catch (error) {
    console.error('Erro ao cadastrar bloqueio:', error)

    if (error.message === 'BLOQUEIO_CONFLITA_AGENDAMENTO') {
      return res.status(409).json({
        mensagem: 'Não é possível bloquear um horário que possui agendamento'
      })
    }

    if (error.message === 'DURACAO_AGENDAMENTO_INVALIDA') {
      return res.status(500).json({
        mensagem: 'Não foi possível validar a duração dos agendamentos'
      })
    }

    if ([
      'DADOS_INVALIDOS',
      'DATA_INVALIDA',
      'HORARIO_INVALIDO',
      'INTERVALO_INVALIDO',
      'MOTIVO_INVALIDO'
    ].includes(error.message)) {
      return res.status(400).json({
        mensagem: 'Os dados do bloqueio são inválidos'
      })
    }

    return res.status(500).json({
      mensagem: 'Erro ao cadastrar bloqueio'
    })
  }
}

export async function excluirBloqueio(req, res) {
  try {
    const { id } = req.params

    if (!uuidValido(id)) {
      return res.status(400).json({
        mensagem: 'ID do bloqueio inválido'
      })
    }

    const resultado = await removerBloqueio(id)

    return res.status(200).json({
      mensagem: 'Bloqueio removido com sucesso',
      id: resultado.id
    })

  } catch (error) {
    console.error('Erro ao remover bloqueio:', error)

    if (error.message === 'BLOQUEIO_NAO_ENCONTRADO') {
      return res.status(404).json({
        mensagem: 'Bloqueio não encontrado'
      })
    }

    return res.status(500).json({
      mensagem: 'Erro ao remover bloqueio'
    })
  }
}
