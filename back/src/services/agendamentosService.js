import { supabase } from '../config/supabase.js'

function converterHorario(horario) {
  const [horas, minutos] = horario.split(':').map(Number)

  return horas * 60 + minutos
}

export async function criarAgendamento(dados) {
  const { cliente_id, servico_id, data, horario } = dados

  // Buscar o serviço escolhido
  const { data: servico, error: erroServico } = await supabase
    .from('servicos')
    .select('id, duracao_minutos, ativo')
    .eq('id', servico_id)
    .maybeSingle()

  if (erroServico) throw erroServico

  if (!servico || !servico.ativo) {
    throw new Error('SERVICO_NAO_DISPONIVEL')
  }

  // Verificar se a data não está no passado
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const dataEscolhida = new Date(`${data}T00:00:00`)

  if (dataEscolhida < hoje) {
    throw new Error('DATA_PASSADA')
  }

  // Calcular o horário de término
  const inicioNovo = converterHorario(horario)
  const fimNovo = inicioNovo + servico.duracao_minutos

  if (fimNovo > 1440) {
    throw new Error('HORARIO_INVALIDO')
  }

  // Buscar agendamentos do mesmo dia
 const { data: agendamentos, error: erroAgendamentos } = await supabase
  .from('agendamento')
  .select('horario, servicos(duracao_minutos)')
  .eq('data', data)
  .neq('status', 'cancelado')

  if (erroAgendamentos) throw erroAgendamentos

  // Verificar se existe conflito de horário
  for (const agendamento of agendamentos) {
    const duracaoExistente =
      agendamento.servicos?.duracao_minutos

    if (!duracaoExistente) {
      throw new Error('NAO_FOI_POSSIVEL_VALIDAR_HORARIO')
    }

    const inicioExistente = converterHorario(agendamento.horario)
    const fimExistente = inicioExistente + duracaoExistente

    if (inicioNovo < fimExistente && fimNovo > inicioExistente) {
      throw new Error('HORARIO_OCUPADO')
    }
  }

  // Salvar o agendamento
  const { data: novoAgendamento, error } = await supabase
  .from('agendamento')
    .insert({
      cliente_id,
      servico_id,
      data,
      horario,
      status: 'pendente'
    })
    .select('*')
    .single()

  if (error) throw error

  return novoAgendamento
}

export async function listarAgendamentos() {
  const { data, error } = await supabase
    .from('agendamento')
    .select(`
      id,
      data,
      horario,
      status,
      criado_em,
      clientes (
        id,
        nome,
        telefone
      ),
      servicos (
        id,
        nome,
        preco,
        duracao_minutos
      )
    `)
    .order('data', { ascending: true })
    .order('horario', { ascending: true })

  if (error) {
    throw error
  }

  return data
}

export async function alterarStatusAgendamento(id, status) {
  const { data, error } = await supabase
    .from('agendamento')
    .update({ status })
    .eq('id', id)
    .select('*')
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    throw new Error('AGENDAMENTO_NAO_ENCONTRADO')
  }

  return data
}