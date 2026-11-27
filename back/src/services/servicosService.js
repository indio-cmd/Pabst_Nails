
import { supabase } from '../config/supabase.js'

export async function listarServicos() {
  const { data, error } = await supabase
    .from('servicos')
    .select('id, nome, descricao, preco, duracao_minutos')
    .eq('ativo', true)
    .order('nome', { ascending: true })

  if (error) {
    throw error
  }

  return data
}
