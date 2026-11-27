
import {
  buscarHorariosDisponiveis
} from '../services/horariosDisponiveisService.js'

function validarData(data) {
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

function uuidValido(id) {
  return typeof id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

export async function listarHorariosDisponiveis(req, res) {
  try {
    const { data, servico_id } = req.query

    if (!data || !servico_id) {
      return res.status(400).json({
        mensagem: 'Informe a data e o ID do serviço'
      })
    }

    if (!validarData(data)) {
      return res.status(400).json({
        mensagem: 'Data inválida. Use AAAA-MM-DD'
      })
    }

    if (!uuidValido(servico_id)) {
      return res.status(400).json({
        mensagem: 'ID do serviço inválido'
      })
    }

    const resultado = await buscarHorariosDisponiveis(
      data,
      servico_id
    )

    return res.status(200).json(resultado)

  } catch (error) {
    console.error('Erro ao buscar horários disponíveis:', error)

    if (error.message === 'DATA_PASSADA') {
      return res.status(400).json({
        mensagem: 'Não é possível consultar datas passadas'
      })
    }

    if (error.message === 'SERVICO_NAO_DISPONIVEL') {
      return res.status(404).json({
        mensagem: 'Serviço não encontrado ou inativo'
      })
    }

    if (error.message === 'DURACAO_INVALIDA') {
      return res.status(400).json({
        mensagem: 'A duração do serviço está inválida'
      })
    }

    if (error.message === 'DURACAO_AGENDAMENTO_INVALIDA') {
      return res.status(500).json({
        mensagem: 'Não foi possível calcular a duração dos agendamentos'
      })
    }

    if (error.message === 'DISPONIBILIDADE_INVALIDA') {
      return res.status(500).json({
        mensagem: 'A configuração dos horários de atendimento está inválida'
      })
    }

    return res.status(500).json({
      mensagem: 'Erro ao consultar horários disponíveis'
    })
  }
}
