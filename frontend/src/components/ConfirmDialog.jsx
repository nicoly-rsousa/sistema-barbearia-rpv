import { useEffect } from 'react'

// Janela de confirmação para ações importantes (principalmente exclusões).
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  danger = false,
  onConfirm,
  onCancel,
}) {
  // Permite cancelar com a tecla Esc
  useEffect(() => {
    if (!open) return undefined
    const aoTeclar = (e) => {
      if (e.key === 'Escape') onCancel?.()
    }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="dialogo-fundo" onClick={onCancel}>
      <div
        className="dialogo"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialogo-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="dialogo-titulo">{title}</h2>
        <p>{message}</p>
        <div className="dialogo-acoes">
          <button type="button" className="btn btn-secundario btn-grande" onClick={onCancel}>
            Cancelar
          </button>
          <button
            type="button"
            className={`btn btn-grande ${danger ? 'btn-perigo' : 'btn-primario'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
