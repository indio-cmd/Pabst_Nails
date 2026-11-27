import {
  listarDisponibilidade,
  alterarDisponibilidade
} from '../services/disponibilidadeService.js'

export async function buscarDisponibilidade(req, res) {
  try {
    const disponibilidade = await listarDisponibilidade()

    return res.status(200).json(disponibilidade)

  } catch (error) {
    console.log(error)

    return res.status(500).json({
      mensagem: 'Erro ao buscar disponibilidade'
    })
  }
}

export async function atualizarDisponibilidade(req, res) {
  try {
    const { id } = req.params
    const { horario_inicio, horario_fim, ativo } = req.body

    if (
      horario_inicio === undefined &&
      horario_fim === undefined &&
      ativo === undefined
    ) {
      return res.status(400).json({
        mensagem: 'Informe o que deseja alterar'
      })
    }

    if (ativo !== undefined && typeof ativo !== 'boolean') {
      return res.status(400).json({
        mensagem: 'O campo ativo deve ser true ou false'
      })
    }

    const disponibilidade = await alterarDisponibilidade(id, {
      horario_inicio,
      horario_fim,
      ativo
    })

    return res.status(200).json({
      mensagem: 'Disponibilidade atualizada com sucesso',
      disponibilidade
    })

  } catch (error) {
    console.log(error)

    if (error.message === 'DISPONIBILIDADE_NAO_ENCONTRADA') {
      return res.status(404).json({
        mensagem: 'Disponibilidade não encontrada'
      })
    }

    if (
      error.message === 'HORARIO_INVALIDO' ||
      error.message === 'INTERVALO_INVALIDO' ||
      error.message === 'NENHUMA_ALTERACAO'
    ) {
      return res.status(400).json({
        mensagem: 'Horários inválidos ou alteração não permitida'
      })
    }

    return res.status(500).json({
      mensagem: 'Erro ao atualizar disponibilidade'
    })
  }
}