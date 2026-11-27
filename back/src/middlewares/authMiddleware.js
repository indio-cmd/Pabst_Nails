
import { authClient } from '../config/authClient.js'

export async function verificarAdmin(req, res, next) {
  try {
    const adminId = process.env.ADMIN_USER_ID?.trim()

    if (!adminId) {
      console.error('ADMIN_USER_ID não configurado')

      return res.status(500).json({
        mensagem: 'Configuração de autenticação inválida'
      })
    }

    const authorization = req.headers.authorization

    if (typeof authorization !== 'string') {
      return res.status(401).json({
        mensagem: 'Token não informado'
      })
    }

    const correspondencia = authorization.match(/^Bearer\s+(\S+)$/i)

    if (!correspondencia) {
      return res.status(401).json({
        mensagem: 'Formato de autenticação inválido'
      })
    }

    const token = correspondencia[1]

    const { data, error } = await authClient.auth.getUser(token)

    if (error || !data.user) {
      return res.status(401).json({
        mensagem: 'Token inválido ou expirado'
      })
    }

    if (data.user.id !== adminId) {
      return res.status(403).json({
        mensagem: 'Acesso permitido somente à administradora'
      })
    }

    req.user = data.user

    return next()

  } catch (error) {
    console.error('Erro ao verificar autenticação:', error)

    return res.status(500).json({
      mensagem: 'Erro ao verificar autenticação'
    })
  }
}
