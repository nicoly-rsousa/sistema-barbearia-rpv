import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { CHAVE_EMPRESA, lerEmpresaSalva } from '../api.js'

// Guarda a empresa (barbearia) escolhida e a mantém no localStorage,
// para que continue selecionada ao recarregar a página.
const EmpresaContext = createContext(null)

export function EmpresaProvider({ children }) {
  const [empresa, setEmpresa] = useState(lerEmpresaSalva)

  const escolherEmpresa = useCallback((nova) => {
    const dados = { id: nova.id, nome: nova.nome }
    try {
      localStorage.setItem(CHAVE_EMPRESA, JSON.stringify(dados))
    } catch {
      // Se o navegador bloquear o armazenamento, a escolha vale só nesta sessão
    }
    setEmpresa(dados)
  }, [])

  const limpar = useCallback(() => {
    try {
      localStorage.removeItem(CHAVE_EMPRESA)
    } catch {
      // Sem armazenamento disponível: nada a remover
    }
    setEmpresa(null)
  }, [])

  const valor = useMemo(
    () => ({ empresa, escolherEmpresa, limpar }),
    [empresa, escolherEmpresa, limpar],
  )

  return <EmpresaContext.Provider value={valor}>{children}</EmpresaContext.Provider>
}

// Uso: const { empresa, escolherEmpresa, limpar } = useEmpresa()
export function useEmpresa() {
  const contexto = useContext(EmpresaContext)
  if (!contexto) throw new Error('useEmpresa deve ser usado dentro de EmpresaProvider')
  return contexto
}
