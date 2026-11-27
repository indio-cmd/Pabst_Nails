
import { authClient } from '../config/authClient.js'

function uuidValido(id) {
  return typeof id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

export async function loginAdmin(req, res) {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({
        mensagem: 'Envie o email e a senha em formato JSON'
      })
    }

    const { email, password } = req.body

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        mensagem: 'Informe seu email e senha'
      })
    }

    const adminId = process.env.ADMIN_USER_ID?.trim()

    if (!uuidValido(adminId)) {
      console.error('ADMIN_USER_ID não configurado corretamente')

      return res.status(500).json({
        mensagem: 'Configuração da administradora inválida'
      })
    }

    const emailLimpo = email.trim()

    const { data, error } = await authClient.auth.signInWithPassword({
      email: emailLimpo,
      password
    })

    if (error || !data.user || !data.session) {
      return res.status(401).json({
        mensagem: 'Email ou senha incorretos'
      })
    }

    if (data.user.id !== adminId) {
      return res.status(403).json({
        mensagem: 'Você não tem autorização de administradora'
      })
    }

    return res.status(200).json({
      mensagem: 'Login realizado com sucesso',
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
      user: {
        id: data.user.id,
        email: data.user.email
      }
    })

  } catch (error) {
    console.error('Erro ao realizar login:', error)

    return res.status(500).json({
      mensagem: 'Erro ao realizar login'
    })
  }
}
