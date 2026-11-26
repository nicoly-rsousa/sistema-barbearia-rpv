import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

// Mensagens rápidas (sucesso/erro) exibidas no canto da tela.
const ToastContext = createContext(null)

const DURACAO_MS = { success: 4000, error: 7000 }

export function ToastProvider({ children }) {
  const [mensagens, setMensagens] = useState([])
  const proximoId = useRef(1)

  const remover = useCallback((id) => {
    setMensagens((atuais) => atuais.filter((m) => m.id !== id))
  }, [])

  const mostrar = useCallback(
    (tipo, texto) => {
      const id = proximoId.current++
      setMensagens((atuais) => [...atuais, { id, tipo, texto }])
      setTimeout(() => remover(id), DURACAO_MS[tipo])
    },
    [remover],
  )

  // Uso: const toast = useToast(); toast.success('Salvo!'); toast.error('Falhou')
  const toast = useMemo(
    () => ({
      success: (msg) => mostrar('success', msg),
      error: (msg) => mostrar('error', msg),
    }),
    [mostrar],
  )

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toasts" aria-live="polite">
        {mensagens.map((m) => (
          <div key={m.id} className={`toast toast-${m.tipo}`} role={m.tipo === 'error' ? 'alert' : 'status'}>
            <span>{m.texto}</span>
            <button type="button" className="toast-fechar" onClick={() => remover(m.id)} aria-label="Fechar mensagem">
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const contexto = useContext(ToastContext)
  if (!contexto) throw new Error('useToast deve ser usado dentro de ToastProvider')
  return contexto
}
