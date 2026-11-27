
import { supabase } from '../config/supabase.js'

const INTERVALO_MINUTOS = 30

function converterHorario(horario) {
  const partes = horario.split(':')

  const horas = Number(partes[0])
  const minutos = Number(partes[1])
  const segundos = Number(partes[2] || 0)

  return horas * 60 + minutos + segundos / 60
}

function formatarHorario(minutos) {
  const horas = String(Math.floor(minutos / 60)).padStart(2, '0')
  const minutosRestantes = String(minutos % 60).padStart(2, '0')

  return `${horas}:${minutosRestantes}`
}

function validarData(data) {
  if (typeof data !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return false
  }

  const dataConvertida = new Date(`${data}T00:00:00.000Z`)

  return !Number.isNaN(dataConvertida.getTime()) &&
    dataConvertida.toISOString().slice(0, 10) === data
}

function obterDiaSemana(data) {
  const [ano, mes, dia] = data.split('-').map(Number)

  return new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay()
}

function obterHorarioAtual() {
  const agora = new Date()

  const partesData = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(agora)

  const partesHora = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(agora)

  const pegar = (partes, nome) =>
    partes.find(parte => parte.type === nome).value

  return {
    data: `${pegar(partesData, 'year')}-${pegar(partesData, 'month')}-${pegar(partesData, 'day')}`,
    minutos:
      Number(pegar(partesHora, 'hour')) * 60 +
      Number(pegar(partesHora, 'minute'))
  }
}

export async function buscarHorariosDisponiveis(data, servicoId) {
  if (!validarData(data)) {
    throw new Error('DATA_INVALIDA')
  }

  const hoje = obterHorarioAtual()

  if (data < hoje.data) {
    throw new Error('DATA_PASSADA')
  }

  const diaSemana = obterDiaSemana(data)

  // Buscar serviço
  const { data: servico, error: erroServico } = await supabase
    .from('servicos')
    .select('id, nome, duracao_minutos, ativo')
    .eq('id', servicoId)
    .maybeSingle()

  if (erroServico) throw erroServico

  if (!servico || !servico.ativo) {
    throw new Error('SERVICO_NAO_DISPONIVEL')
  }

  const duracao = Number(servico.duracao_minutos)

  if (!Number.isInteger(duracao) || duracao <= 0) {
    throw new Error('DURACAO_INVALIDA')
  }

  // Buscar horário de funcionamento
  const { data: disponibilidades, error: erroDisponibilidade } = await supabase
    .from('disponibilidade')
    .select('horario_inicio, horario_fim')
    .eq('dia_semana', diaSemana)
    .eq('ativo', true)

  if (erroDisponibilidade) throw erroDisponibilidade

  if (!disponibilidades.length) {
    return {
      data,
      servico: servico.nome,
      duracao_minutos: duracao,
      horarios_disponiveis: []
    }
  }

  // Buscar bloqueios da data
  const { data: bloqueios, error: erroBloqueios } = await supabase
    .from('horarios_bloqueados')
    .select('horario_inicio, horario_fim')
    .eq('data', data)

  if (erroBloqueios) throw erroBloqueios

  // Buscar agendamentos do mesmo dia
  const { data: agendamentos, error: erroAgendamentos } = await supabase
    .from('agendamento')
    .select('horario, servico_id, status')
    .eq('data', data)

  if (erroAgendamentos) throw erroAgendamentos

  // Ignorar somente os agendamentos cancelados
  const agendamentosAtivos = agendamentos.filter(item =>
    String(item.status).toLowerCase() !== 'cancelado'
  )

  // Buscar duração dos serviços já agendados
  const idsServicos = [
    ...new Set(agendamentosAtivos.map(item => item.servico_id))
  ]

  let duracoesServicos = []

  if (idsServicos.length > 0) {
    const { data, error } = await supabase
      .from('servicos')
      .select('id, duracao_minutos')
      .in('id', idsServicos)

    if (error) throw error

    duracoesServicos = data
  }

  const mapaDuracoes = new Map(
    duracoesServicos.map(item => [
      item.id,
      Number(item.duracao_minutos)
    ])
  )

  // Calcular horários ocupados
  const horariosOcupados = agendamentosAtivos.map(item => {
    const duracaoExistente = mapaDuracoes.get(item.servico_id)

    if (!Number.isInteger(duracaoExistente) || duracaoExistente <= 0) {
      throw new Error('DURACAO_AGENDAMENTO_INVALIDA')
    }

    const inicio = converterHorario(item.horario)

    return {
      inicio,
      fim: inicio + duracaoExistente
    }
  })

  // Calcular períodos bloqueados
  const horariosBloqueados = bloqueios.map(item => ({
    inicio: converterHorario(item.horario_inicio),
    fim: converterHorario(item.horario_fim)
  }))

  const horariosDisponiveis = new Set()

  // Gerar horários possíveis
  for (const disponibilidade of disponibilidades) {
    const inicioFuncionamento = converterHorario(disponibilidade.horario_inicio)
    const fimFuncionamento = converterHorario(disponibilidade.horario_fim)

    // A configuração precisa usar horários sem segundos
    if (
      !Number.isInteger(inicioFuncionamento) ||
      !Number.isInteger(fimFuncionamento) ||
      inicioFuncionamento >= fimFuncionamento
    ) {
      throw new Error('DISPONIBILIDADE_INVALIDA')
    }

    for (
      let inicio = inicioFuncionamento;
      inicio + duracao <= fimFuncionamento;
      inicio += INTERVALO_MINUTOS
    ) {
      const fim = inicio + duracao

      // Não oferecer horários que já passaram
      if (data === hoje.data && inicio <= hoje.minutos) {
        continue
      }

      // Verificar agendamentos existentes
      const ocupado = horariosOcupados.some(item =>
        inicio < item.fim && fim > item.inicio
      )

      // Verificar bloqueios
      const bloqueado = horariosBloqueados.some(item =>
        inicio < item.fim && fim > item.inicio
      )

      if (!ocupado && !bloqueado) {
        horariosDisponiveis.add(formatarHorario(inicio))
      }
    }
  }

  return {
    data,
    servico: servico.nome,
    duracao_minutos: duracao,
    horarios_disponiveis: [...horariosDisponiveis].sort()
  }
}
