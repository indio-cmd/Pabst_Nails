
import { supabase } from '../config/supabase.js'

function normalizarHorario(horario) {
  if (
    typeof horario !== 'string' ||
    !/^([01]\d|2[0-3]):[0-5]\d(?::00)?$/.test(horario)
  ) {
    throw new Error('HORARIO_INVALIDO')
  }

  return horario.slice(0, 5)
}

function converterHorario(horario) {
  const [horas, minutos] = horario.split(':').map(Number)

  return horas * 60 + minutos
}

export async function listarDisponibilidade() {
  const { data, error } = await supabase
    .from('disponibilidade')
    .select('id, dia_semana, horario_inicio, horario_fim, ativo')
    .order('dia_semana', { ascending: true })

  if (error) throw error

  return data
}

export async function alterarDisponibilidade(id, dados) {
  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) {
    throw new Error('NENHUMA_ALTERACAO')
  }

  const camposPermitidos = [
    'horario_inicio',
    'horario_fim',
    'ativo'
  ]

  const camposRecebidos = Object.keys(dados)

  if (camposRecebidos.some(campo => !camposPermitidos.includes(campo))) {
    throw new Error('NENHUMA_ALTERACAO')
  }

  const { data: atual, error: erroBusca } = await supabase
    .from('disponibilidade')
    .select('id, dia_semana, horario_inicio, horario_fim, ativo')
    .eq('id', id)
    .maybeSingle()

  if (erroBusca) throw erroBusca

  if (!atual) {
    throw new Error('DISPONIBILIDADE_NAO_ENCONTRADA')
  }

  const horarioInicio = normalizarHorario(
    dados.horario_inicio ?? atual.horario_inicio
  )

  const horarioFim = normalizarHorario(
    dados.horario_fim ?? atual.horario_fim
  )

  if (converterHorario(horarioInicio) >= converterHorario(horarioFim)) {
    throw new Error('INTERVALO_INVALIDO')
  }

  if (
    dados.ativo !== undefined &&
    typeof dados.ativo !== 'boolean'
  ) {
    throw new Error('HORARIO_INVALIDO')
  }

  const atualizacoes = {}

  if (dados.horario_inicio !== undefined) {
    atualizacoes.horario_inicio = horarioInicio
  }

  if (dados.horario_fim !== undefined) {
    atualizacoes.horario_fim = horarioFim
  }

  if (dados.ativo !== undefined) {
    atualizacoes.ativo = dados.ativo
  }

  if (Object.keys(atualizacoes).length === 0) {
    throw new Error('NENHUMA_ALTERACAO')
  }

  const { data, error } = await supabase
    .from('disponibilidade')
    .update(atualizacoes)
    .eq('id', id)
    .select('id, dia_semana, horario_inicio, horario_fim, ativo')
    .single()

  if (error) throw error

  return data
}
