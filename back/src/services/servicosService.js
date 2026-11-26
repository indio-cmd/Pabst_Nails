import { supabase } from '../config/supabase.js'

export async function listarServicos() {
  const { data, error } = await supabase
    .from('servicos')
    .select('*')
    .eq('ativo', true)
    .order('nome')

  if (error) {
    throw error
  }

  return data
}