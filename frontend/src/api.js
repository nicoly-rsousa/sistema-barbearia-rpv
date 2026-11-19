const API_URL = import.meta.env.VITE_API_URL || '';

export async function api(path, { method = 'GET', body, empresaId, headers = {} } = {}) {
  const finalHeaders = { ...headers };
  if (body !== undefined) finalHeaders['Content-Type'] = 'application/json';
  if (empresaId && path !== '/empresas' && !path.startsWith('/empresas/')) {
    finalHeaders['x-empresa-id'] = String(empresaId);
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: finalHeaders,
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch {
    throw new Error('Não foi possível conectar à API. Confirme se o backend está ativo em http://localhost:3000.');
  }

  const raw = await response.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }

  if (!response.ok) {
    const message = Array.isArray(data?.message)
      ? data.message.join(' | ')
      : data?.message || data?.error || `Erro HTTP ${response.status}`;
    throw new Error(message);
  }
  return data;
}

export const money = value => Number(value || 0).toLocaleString('pt-BR', {
  style: 'currency', currency: 'BRL'
});

export const dateTime = value => value
  ? new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
  : '—';