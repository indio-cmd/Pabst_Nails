import { supabase } from '../config/supabase.js'

function converterHorario(horario) {
  const [horas, minutos] = horario.split(':').map(Number)

  return horas * 60 + minutos
}

export async function listarDisponibilidade() {
  const { data, error } = await supabase
    .from('disponibilidade')
    .select('*')
    .order('dia_semana')

  if (error) throw error

  return data
}

export async function alterarDisponibilidade(id, dados) {
  const { data: atual, error: erroBusca } = await supabase
    .from('disponibilidade')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (erroBusca) throw erroBusca

  if (!atual) {
    throw new Error('DISPONIBILIDADE_NAO_ENCONTRADA')
  }

  const horarioInicio = dados.horario_inicio ?? atual.horario_inicio
  const horarioFim = dados.horario_fim ?? atual.horario_fim

  if (
    !/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(horarioInicio) ||
    !/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(horarioFim)
  ) {
    throw new Error('HORARIO_INVALIDO')
  }

  if (converterHorario(horarioInicio) >= converterHorario(horarioFim)) {
    throw new Error('INTERVALO_INVALIDO')
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
    .select('*')
    .single()

  if (error) throw error

  return data
}