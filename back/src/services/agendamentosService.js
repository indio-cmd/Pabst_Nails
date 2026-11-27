
import { supabase } from '../config/supabase.js'

export async function criarAgendamento(dados) {
  const { cliente_id, servico_id, data, horario } = dados

  const { data: agendamento, error } = await supabase.rpc(
    'criar_agendamento',
    {
      p_cliente_id: cliente_id,
      p_servico_id: servico_id,
      p_data: data,
      p_horario: horario
    }
  )

  if (error) {
    const mensagem = error.message || ''

    if (mensagem.includes('HORARIO_OCUPADO')) {
      throw new Error('HORARIO_OCUPADO')
    }

    if (mensagem.includes('HORARIO_BLOQUEADO')) {
      throw new Error('HORARIO_BLOQUEADO')
    }

    if (mensagem.includes('HORARIO_FORA_DISPONIBILIDADE')) {
      throw new Error('HORARIO_FORA_DISPONIBILIDADE')
    }

    if (mensagem.includes('SERVICO_NAO_DISPONIVEL')) {
      throw new Error('SERVICO_NAO_DISPONIVEL')
    }

    if (mensagem.includes('DATA_PASSADA')) {
      throw new Error('DATA_PASSADA')
    }

    if (mensagem.includes('HORARIO_PASSADO')) {
  throw new Error('HORARIO_PASSADO')
}

    if (mensagem.includes('HORARIO_INVALIDO')) {
      throw new Error('HORARIO_INVALIDO')
    }

    if (mensagem.includes('DURACAO_INVALIDA')) {
      throw new Error('DURACAO_INVALIDA')
    }

    throw error
  }

  return agendamento
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
