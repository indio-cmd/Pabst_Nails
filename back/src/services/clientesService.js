import { supabase } from '../config/supabase.js'

export async function cadastrarCliente(nome, telefone) {
  const { data, error } = await supabase
    .from('clientes')
    .insert({
      nome,
      telefone
    })
    .select('id, nome, telefone')
    .single()

  if (error) {
    throw error
  }

  return data
}