import { authClient } from '../config/authClient.js'

export async function loginAdmin(req, res) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        mensagem: 'Informe seu email e senha'
      })
    }

    if (!process.env.ADMIN_USER_ID) {
      return res.status(500).json({
        mensagem: 'ID da administradora não configurado'
      })
    }

    const { data, error } = await authClient.auth.signInWithPassword({
      email: email.trim(),
      password
    })

    if (error || !data.user || !data.session) {
      return res.status(401).json({
        mensagem: 'Email ou senha incorretos'
      })
    }

    if (data.user.id !== process.env.ADMIN_USER_ID) {
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
    console.log(error)

    return res.status(500).json({
      mensagem: 'Erro ao realizar login'
    })
  }
}