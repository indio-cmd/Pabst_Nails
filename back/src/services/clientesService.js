
import { supabase } from '../config/supabase.js'

export async function cadastrarCliente(nome, telefone) {
  const nomeLimpo = nome.trim()
  const telefoneLimpo = telefone.trim()

  const { data, error } = await supabase
    .from('clientes')
    .insert({
      nome: nomeLimpo,
      telefone: telefoneLimpo
    })
    .select('id, nome, telefone')
    .single()

  if (error) {
    throw error
  }

  return data
}
