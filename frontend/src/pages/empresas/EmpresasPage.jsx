import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api.js'
import { useEmpresa } from '../../context/EmpresaContext.jsx'
import ApiIndisponivel from '../../components/ApiIndisponivel.jsx'

// Tela de seleção de empresa: lista as empresas ativas e guarda a escolhida.
export default function EmpresasPage() {
  const { empresa: atual, escolherEmpresa } = useEmpresa()
  const navigate = useNavigate()
  const [empresas, setEmpresas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const ultimaBusca = useRef(0)

  const carregar = useCallback(async () => {
    const busca = ++ultimaBusca.current
    setCarregando(true)
    setErro(null)
    try {
      const dados = await api.get('/empresas')
      if (busca === ultimaBusca.current) setEmpresas(Array.isArray(dados) ? dados : [])
    } catch (e) {
      if (busca === ultimaBusca.current) setErro(e.message)
    } finally {
      if (busca === ultimaBusca.current) setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregar()
    return () => {
      ultimaBusca.current++
    }
  }, [carregar])

  function escolher(empresa) {
    escolherEmpresa(empresa)
    navigate('/')
  }

  return (
    <div className="selecao">
      <div className="selecao-caixa">
        <h1>Escolha a barbearia</h1>
        <p className="selecao-ajuda">Selecione a empresa em que você vai trabalhar agora.</p>

        {carregando && <p>Carregando empresas...</p>}

        {!carregando && erro && <ApiIndisponivel mensagem={erro} onTentarNovamente={carregar} />}

        {!carregando && !erro && empresas.length === 0 && (
          <div className="card">
            <p>Nenhuma empresa ativa encontrada.</p>
          </div>
        )}

        {!carregando && !erro && empresas.length > 0 && (
          <ul className="empresas-lista">
            {empresas.map((empresa) => (
              <li key={empresa.id} className="card empresa-item">
                <div>
                  <strong className="empresa-nome">{empresa.nome}</strong>
                  <span className="empresa-detalhe">CNPJ: {empresa.cnpj}</span>
                  {atual?.id === empresa.id && <span className="etiqueta">Empresa atual</span>}
                </div>
                <button type="button" className="btn btn-primario btn-grande" onClick={() => escolher(empresa)}>
                  Entrar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
