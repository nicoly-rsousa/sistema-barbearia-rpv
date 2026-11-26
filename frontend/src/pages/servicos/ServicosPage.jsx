import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../../api.js'
import { useEmpresa } from '../../context/EmpresaContext.jsx'
import { useToast } from '../../components/ToastProvider.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import ApiIndisponivel from '../../components/ApiIndisponivel.jsx'

const formatarPreco = (valor) =>
  Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const FORM_VAZIO = { nome: '', preco: '', duracaoMin: '' }

// Aceita "40", "40.5" ou "40,50" e devolve número (ou NaN se não for válido)
const lerPreco = (texto) => Number(String(texto).trim().replace(',', '.'))

// Listagem e cadastro de serviços da empresa selecionada.
export default function ServicosPage() {
  const { empresa } = useEmpresa()
  const toast = useToast()

  const [servicos, setServicos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erroLista, setErroLista] = useState(null)

  const [formAberto, setFormAberto] = useState(false)
  const [editandoId, setEditandoId] = useState(null) // null = criando um novo
  const [form, setForm] = useState(FORM_VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [erroForm, setErroForm] = useState(null)

  const [paraExcluir, setParaExcluir] = useState(null)
  const [excluindo, setExcluindo] = useState(false)

  const ultimaBusca = useRef(0)

  const carregar = useCallback(async () => {
    const busca = ++ultimaBusca.current
    setCarregando(true)
    setErroLista(null)
    try {
      const dados = await api.get('/servicos')
      if (busca === ultimaBusca.current) setServicos(Array.isArray(dados) ? dados : [])
    } catch (e) {
      if (busca === ultimaBusca.current) setErroLista(e.message)
    } finally {
      if (busca === ultimaBusca.current) setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregar()
    return () => {
      ultimaBusca.current++
    }
  }, [carregar, empresa?.id])

  function abrirNovo() {
    setEditandoId(null)
    setForm(FORM_VAZIO)
    setErroForm(null)
    setFormAberto(true)
  }

  function abrirEdicao(servico) {
    setEditandoId(servico.id)
    setForm({
      nome: servico.nome,
      preco: String(servico.preco).replace('.', ','),
      duracaoMin: String(servico.duracaoMin),
    })
    setErroForm(null)
    setFormAberto(true)
  }

  function fecharForm() {
    setFormAberto(false)
    setEditandoId(null)
    setErroForm(null)
  }

  function alterarCampo(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }))
  }

  async function salvar(e) {
    e.preventDefault()
    setErroForm(null)

    // Conferência simples antes de enviar; a API continua sendo a validação oficial
    const preco = lerPreco(form.preco)
    const duracaoMin = Number(form.duracaoMin)
    const problemas = []
    if (!form.nome.trim()) problemas.push('Informe o nome do serviço')
    if (!Number.isFinite(preco) || preco <= 0) problemas.push('Informe um preço maior que zero')
    if (!Number.isInteger(duracaoMin) || duracaoMin < 5) problemas.push('A duração deve ser de no mínimo 5 minutos')
    if (problemas.length > 0) {
      setErroForm(problemas.join('; '))
      return
    }

    const dados = { nome: form.nome.trim(), preco, duracaoMin }
    setSalvando(true)
    try {
      if (editandoId === null) {
        await api.post('/servicos', dados)
        toast.success('Serviço cadastrado com sucesso')
      } else {
        await api.patch(`/servicos/${editandoId}`, dados)
        toast.success('Serviço atualizado com sucesso')
      }
      fecharForm()
      await carregar()
    } catch (err) {
      // Mostra a mensagem que a API devolveu (ex.: erros de validação)
      setErroForm(err.message)
    } finally {
      setSalvando(false)
    }
  }

  async function confirmarExclusao() {
    if (!paraExcluir || excluindo) return
    setExcluindo(true)
    try {
      await api.delete(`/servicos/${paraExcluir.id}`)
      toast.success('Serviço excluído com sucesso')
      setParaExcluir(null)
      await carregar()
    } catch (err) {
      // Ex.: serviço já usado em agendamento — exibe o texto devolvido pelo back-end
      toast.error(err.message)
      setParaExcluir(null)
    } finally {
      setExcluindo(false)
    }
  }

  return (
    <section>
      <div className="titulo-linha">
        <h1>Serviços</h1>
        {!formAberto && (
          <button type="button" className="btn btn-primario btn-grande" onClick={abrirNovo}>
            Novo serviço
          </button>
        )}
      </div>

      {formAberto && (
        <form className="card formulario" onSubmit={salvar} noValidate>
          <h2>{editandoId === null ? 'Novo serviço' : 'Editar serviço'}</h2>

          <div className="campo">
            <label htmlFor="servico-nome">Nome</label>
            <input
              id="servico-nome"
              type="text"
              value={form.nome}
              onChange={(e) => alterarCampo('nome', e.target.value)}
              disabled={salvando}
              autoFocus
            />
          </div>

          <div className="campos-linha">
            <div className="campo">
              <label htmlFor="servico-preco">Preço (R$)</label>
              <input
                id="servico-preco"
                type="text"
                inputMode="decimal"
                placeholder="Ex.: 40,00"
                value={form.preco}
                onChange={(e) => alterarCampo('preco', e.target.value)}
                disabled={salvando}
              />
              {editandoId !== null && (
                <small className="aviso">Agendamentos já marcados mantêm o preço antigo.</small>
              )}
            </div>

            <div className="campo">
              <label htmlFor="servico-duracao">Duração (minutos)</label>
              <input
                id="servico-duracao"
                type="number"
                min="5"
                step="1"
                placeholder="Ex.: 30"
                value={form.duracaoMin}
                onChange={(e) => alterarCampo('duracaoMin', e.target.value)}
                disabled={salvando}
              />
            </div>
          </div>

          {erroForm && (
            <p className="mensagem-erro" role="alert">
              {erroForm}
            </p>
          )}

          <div className="formulario-acoes">
            <button type="button" className="btn btn-secundario btn-grande" onClick={fecharForm} disabled={salvando}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primario btn-grande" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      )}

      {carregando && <p>Carregando serviços...</p>}

      {!carregando && erroLista && <ApiIndisponivel mensagem={erroLista} onTentarNovamente={carregar} />}

      {!carregando && !erroLista && servicos.length === 0 && (
        <div className="card">
          <p>Nenhum serviço cadastrado ainda. Clique em “Novo serviço” para começar.</p>
        </div>
      )}

      {!carregando && !erroLista && servicos.length > 0 && (
        <div className="card tabela-caixa">
          <table className="tabela">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Preço</th>
                <th>Duração</th>
                <th className="coluna-acoes">Ações</th>
              </tr>
            </thead>
            <tbody>
              {servicos.map((servico) => (
                <tr key={servico.id}>
                  <td>{servico.nome}</td>
                  <td>{formatarPreco(servico.preco)}</td>
                  <td>{servico.duracaoMin} min</td>
                  <td className="coluna-acoes">
                    <button type="button" className="btn btn-secundario" onClick={() => abrirEdicao(servico)}>
                      Editar
                    </button>
                    <button type="button" className="btn btn-perigo" onClick={() => setParaExcluir(servico)}>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={paraExcluir !== null}
        title="Excluir serviço"
        message={`Deseja realmente excluir o serviço "${paraExcluir?.nome ?? ''}"? Esta ação não pode ser desfeita.`}
        confirmLabel={excluindo ? 'Excluindo...' : 'Excluir'}
        danger
        onConfirm={confirmarExclusao}
        onCancel={() => !excluindo && setParaExcluir(null)}
      />
    </section>
  )
}
