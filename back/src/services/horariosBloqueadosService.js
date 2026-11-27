
import { supabase } from '../config/supabase.js'

function validarData(data) {
  if (
    typeof data !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(data)
  ) {
    return false
  }

  const dataConvertida = new Date(`${data}T00:00:00.000Z`)

  return !Number.isNaN(dataConvertida.getTime()) &&
    dataConvertida.toISOString().slice(0, 10) === data
}

function converterHorario(horario) {
  const [horas, minutos, segundos = 0] = horario.split(':').map(Number)

  return horas * 60 + minutos + segundos / 60
}

function validarHorario(horario) {
  return typeof horario === 'string' &&
    /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(horario)
}

export async function listarBloqueios() {
  const { data, error } = await supabase
    .from('horarios_bloqueados')
    .select('id, data, horario_inicio, horario_fim, motivo')
    .order('data', { ascending: true })
    .order('horario_inicio', { ascending: true })

  if (error) throw error

  return data
}

export async function criarBloqueio(dados) {
  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) {
    throw new Error('DADOS_INVALIDOS')
  }

  const {
    data,
    horario_inicio,
    horario_fim,
    motivo
  } = dados

  if (!validarData(data)) {
    throw new Error('DATA_INVALIDA')
  }

  if (
    !validarHorario(horario_inicio) ||
    !validarHorario(horario_fim)
  ) {
    throw new Error('HORARIO_INVALIDO')
  }

  const inicio = converterHorario(horario_inicio)
  const fim = converterHorario(horario_fim)

  if (inicio >= fim) {
    throw new Error('INTERVALO_INVALIDO')
  }

  if (
    motivo !== undefined &&
    motivo !== null &&
    typeof motivo !== 'string'
  ) {
    throw new Error('MOTIVO_INVALIDO')
  }

  const motivoLimpo = motivo?.trim() || null

  // Buscar agendamentos existentes na data
  const { data: agendamentos, error: erroAgendamentos } = await supabase
    .from('agendamento')
    .select('horario, servico_id, status')
    .eq('data', data)

  if (erroAgendamentos) throw erroAgendamentos

  // Ignorar agendamentos cancelados
  const agendamentosAtivos = agendamentos.filter(item =>
    String(item.status).toLowerCase() !== 'cancelado'
  )

  // Buscar duração dos serviços agendados
  const idsServicos = [
    ...new Set(agendamentosAtivos.map(item => item.servico_id))
  ]

  let servicos = []

  if (idsServicos.length > 0) {
    const { data, error } = await supabase
      .from('servicos')
      .select('id, duracao_minutos')
      .in('id', idsServicos)

    if (error) throw error

    servicos = data
  }

  const mapaDuracoes = new Map(
    servicos.map(item => [
      item.id,
      Number(item.duracao_minutos)
    ])
  )

  // Verificar conflito com agendamentos existentes
  for (const agendamento of agendamentosAtivos) {
    const duracao = mapaDuracoes.get(agendamento.servico_id)

    if (!Number.isInteger(duracao) || duracao <= 0) {
      throw new Error('DURACAO_AGENDAMENTO_INVALIDA')
    }

    const inicioAgendamento = converterHorario(agendamento.horario)
    const fimAgendamento = inicioAgendamento + duracao

    if (
      inicio < fimAgendamento &&
      fim > inicioAgendamento
    ) {
      throw new Error('BLOQUEIO_CONFLITA_AGENDAMENTO')
    }
  }

  // Criar bloqueio
  const { data: bloqueio, error } = await supabase
    .from('horarios_bloqueados')
    .insert({
      data,
      horario_inicio,
      horario_fim,
      motivo: motivoLimpo
    })
    .select('id, data, horario_inicio, horario_fim, motivo')
    .single()

  if (error) throw error

  return bloqueio
}

export async function removerBloqueio(id) {
  const { data, error } = await supabase
    .from('horarios_bloqueados')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle()

  if (error) throw error

  if (!data) {
    throw new Error('BLOQUEIO_NAO_ENCONTRADO')
  }

  return data
}
