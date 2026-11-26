// Camada de comunicação com a API do back-end (NestJS).
// Todas as telas devem usar este arquivo em vez de chamar fetch diretamente.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const TEMPO_LIMITE_MS = 10_000

// Chave do localStorage onde o contexto da empresa guarda { id, nome }.
// O contexto (EmpresaContext) e esta camada usam a mesma chave.
export const CHAVE_EMPRESA = 'barbearia:empresa'

export function lerEmpresaSalva() {
  try {
    const bruto = localStorage.getItem(CHAVE_EMPRESA)
    if (!bruto) return null
    const dados = JSON.parse(bruto)
    return dados && dados.id ? dados : null
  } catch {
    return null
  }
}

// Erro padronizado: "tipo" indica se foi conexão, demora ou resposta de erro da API.
export class ApiError extends Error {
  constructor(mensagem, { tipo = 'http', status } = {}) {
    super(mensagem)
    this.name = 'ApiError'
    this.tipo = tipo // 'conexao' | 'tempo' | 'http'
    this.status = status
  }
}

// As rotas de empresas não dependem da empresa selecionada,
// então nelas o cabeçalho x-empresa-id não é enviado.
function rotaDeEmpresas(caminho) {
  return /^\/empresas(\/|\?|$)/.test(caminho)
}

// O Nest devolve { message: string | string[], ... }.
// Quando for lista (erros de validação), juntamos os textos com "; ".
function extrairMensagem(dados) {
  if (!dados || dados.message === undefined || dados.message === null) return null
  return Array.isArray(dados.message) ? dados.message.join('; ') : String(dados.message)
}

async function requisitar(metodo, caminho, corpo) {
  const headers = {}
  if (corpo !== undefined) headers['Content-Type'] = 'application/json'

  if (!rotaDeEmpresas(caminho)) {
    const empresa = lerEmpresaSalva()
    if (empresa) headers['x-empresa-id'] = String(empresa.id)
  }

  const controle = new AbortController()
  let estourouTempo = false
  const cronometro = setTimeout(() => {
    estourouTempo = true
    controle.abort()
  }, TEMPO_LIMITE_MS)

  let resposta
  let texto
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      method: metodo,
      headers,
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
      signal: controle.signal,
    })
    texto = await resposta.text()
  } catch {
    if (estourouTempo) {
      throw new ApiError('O servidor está demorando para responder', { tipo: 'tempo' })
    }
    throw new ApiError('Não foi possível conectar ao servidor', { tipo: 'conexao' })
  } finally {
    clearTimeout(cronometro)
  }

  let dados = null
  if (texto) {
    try {
      dados = JSON.parse(texto)
    } catch {
      dados = null
    }
  }

  if (!resposta.ok) {
    const mensagem = extrairMensagem(dados) || `Erro ${resposta.status} ao falar com o servidor`
    throw new ApiError(mensagem, { tipo: 'http', status: resposta.status })
  }

  return dados
}

export const api = {
  get: (caminho) => requisitar('GET', caminho),
  post: (caminho, corpo) => requisitar('POST', caminho, corpo),
  patch: (caminho, corpo) => requisitar('PATCH', caminho, corpo),
  delete: (caminho) => requisitar('DELETE', caminho),
}
