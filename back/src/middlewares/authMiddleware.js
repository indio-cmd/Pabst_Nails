import { authClient } from '../config/authClient.js'

export async function verificarAdmin(req, res, next) {
  try {
    const authorization = req.headers.authorization

    if (!authorization || !authorization.startsWith('Bearer ')) {
      return res.status(401).json({
        mensagem: 'Token não informado'
      })
    }

    const token = authorization.slice(7).trim()

    const { data, error } = await authClient.auth.getUser(token)

    if (error || !data.user) {
      return res.status(401).json({
        mensagem: 'Token inválido ou expirado'
      })
    }

    if (data.user.id !== process.env.ADMIN_USER_ID) {
      return res.status(403).json({
        mensagem: 'Acesso permitido somente à administradora'
      })
    }

    req.user = data.user

    next()

  } catch (error) {
    console.log(error)

    return res.status(500).json({
      mensagem: 'Erro ao verificar autenticação'
    })
  }
}