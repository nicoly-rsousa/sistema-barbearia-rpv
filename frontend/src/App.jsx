import { useEffect, useMemo, useState } from 'react';
import { api, money, dateTime } from './api';

const NAV = [
  ['inicio', 'Visão geral', '⌂'],
  ['agendamentos', 'Agendamentos', '▦'],
  ['clientes', 'Clientes', '♙'],
  ['profissionais', 'Profissionais', '✂'],
  ['servicos', 'Serviços', '◇'],
  ['empresas', 'Empresas', '▣']
];

const EMPTY = {
  empresas: { nome: '', cnpj: '', telefone: '' },
  clientes: { nome: '', telefone: '' },
  profissionais: { nome: '' },
  servicos: { nome: '', preco: '', duracaoMin: '' }
};

const LABELS = {
  empresas: 'Empresa', clientes: 'Cliente',
  profissionais: 'Profissional', servicos: 'Serviço'
};

export default function App() {
  const [page, setPage] = useState('inicio');
  const [empresas, setEmpresas] = useState([]);
  const [empresaId, setEmpresaId] = useState(localStorage.getItem('rpv_empresa') || '');
  const [data, setData] = useState({ clientes: [], profissionais: [], servicos: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [search, setSearch] = useState('');
  const [appointment, setAppointment] = useState({
    clienteId: '', profissionalId: '', inicio: '', servicoIds: []
  });

  const empresaAtual = empresas.find(e => String(e.id) === String(empresaId));

  async function loadEmpresas() {
    try {
      const rows = await api('/empresas');
      setEmpresas(Array.isArray(rows) ? rows : []);
      if (!empresaId && rows?.length) setEmpresaId(String(rows[0].id));
    } catch (e) { setError(e.message); }
  }

  async function loadData() {
    if (!empresaId) { setData({ clientes: [], profissionais: [], servicos: [] }); return; }
    setLoading(true); setError('');
    try {
      const [clientes, profissionais, servicos] = await Promise.all([
        api('/clientes', { empresaId }),
        api('/profissionais', { empresaId }),
        api('/servicos', { empresaId })
      ]);
      setData({ clientes, profissionais, servicos });
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadEmpresas(); }, []);
  useEffect(() => {
    if (empresaId) {
      localStorage.setItem('rpv_empresa', empresaId);
      loadData();
    }
  }, [empresaId]);

  const filtered = useMemo(() => {
    const rows = data[page] || [];
    const term = search.toLowerCase();
    return rows.filter(row => JSON.stringify(row).toLowerCase().includes(term));
  }, [data, page, search]);

  function flash(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3500);
  }

  function openCreate(type) {
    setForm({ ...EMPTY[type] });
    setModal({ type, mode: 'create' });
  }
  function openEdit(type, row) {
    setForm({ ...row });
    setModal({ type, mode: 'edit', id: row.id });
  }

  async function saveEntity(event) {
    event.preventDefault();
    const { type, mode, id } = modal;
    const payload = { ...form };
    if (type === 'servicos') {
      payload.preco = Number(payload.preco);
      payload.duracaoMin = Number(payload.duracaoMin);
    }
    try {
      await api(mode === 'create' ? `/${type}` : `/${type}/${id}`, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        body: payload,
        empresaId: type === 'empresas' ? undefined : empresaId
      });
      setModal(null);
      if (type === 'empresas') await loadEmpresas();
      else await loadData();
      flash(`${LABELS[type]} ${mode === 'create' ? 'cadastrado' : 'atualizado'} com sucesso.`);
    } catch (e) { setError(e.message); }
  }

  async function removeEntity(type, row) {
    if (!window.confirm(`Deseja realmente excluir "${row.nome}"?`)) return;
    try {
      await api(`/${type}/${row.id}`, { method: 'DELETE', empresaId });
      await loadData();
      flash(`${LABELS[type]} excluído(a) com sucesso.`);
    } catch (e) { setError(e.message); }
  }

  async function toggleProfessional(row) {
    try {
      await api(`/profissionais/${row.id}`, {
        method: 'PATCH', empresaId, body: { ativo: !row.ativo }
      });
      await loadData();
      flash(`Profissional ${row.ativo ? 'desativado' : 'ativado'}.`);
    } catch (e) { setError(e.message); }
  }

  async function createAppointment(event) {
    event.preventDefault();
    try {
      const created = await api('/agendamentos', {
        method: 'POST', empresaId,
        body: {
          clienteId: Number(appointment.clienteId),
          profissionalId: Number(appointment.profissionalId),
          inicio: new Date(appointment.inicio).toISOString(),
          servicoIds: appointment.servicoIds.map(Number)
        }
      });
      setAppointment({ clienteId: '', profissionalId: '', inicio: '', servicoIds: [] });
      flash(`Agendamento #${created.id} criado. Término previsto: ${dateTime(created.fim)}.`);
    } catch (e) { setError(e.message); }
  }

  const totalClientes = data.clientes.length;
  const totalProfissionais = data.profissionais.length;
  const totalServicos = data.servicos.length;

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">R</div>
        <div><strong>RPV</strong><span>BARBEARIA</span></div>
      </div>
      <div className="side-label">MENU PRINCIPAL</div>
      <nav>{NAV.map(([key, label, icon]) =>
        <button key={key} className={`nav-item ${page === key ? 'active' : ''}`} onClick={() => { setPage(key); setSearch(''); setError(''); }}>
          <span className="nav-icon">{icon}</span>{label}
        </button>
      )}</nav>
      <div className="sidebar-bottom">
        <span className="status-dot"></span> Sistema de gestão
        <small>RPV • Painel administrativo</small>
      </div>
    </aside>

    <main className="main-area">
      <header className="topbar">
        <div><span className="eyebrow">PAINEL ADMINISTRATIVO</span><h1>{NAV.find(n => n[0] === page)?.[1]}</h1></div>
        <div className="company-select">
          <label htmlFor="empresa">EMPRESA ATIVA</label>
          <select id="empresa" value={empresaId} onChange={e => setEmpresaId(e.target.value)}>
            <option value="">Selecione uma empresa</option>
            {empresas.map(e => <option key={e.id} value={e.id}>{e.nome} {e.ativa === false ? '(inativa)' : ''}</option>)}
          </select>
        </div>
      </header>

      {error && <div className="alert error"><span>{error}</span><button onClick={() => setError('')}>×</button></div>}
      {notice && <div className="alert success">{notice}</div>}

      {!empresaId && page !== 'empresas' ? <section className="empty-state">
        <div className="empty-icon">▣</div><h2>Selecione uma empresa</h2>
        <p>Escolha uma empresa no canto superior direito ou cadastre uma nova para começar.</p>
        <button className="button primary" onClick={() => setPage('empresas')}>Cadastrar empresa</button>
      </section> : <>
        {page === 'inicio' && <Dashboard empresa={empresaAtual} data={data} loading={loading} setPage={setPage} />}
        {['clientes', 'profissionais', 'servicos'].includes(page) &&
          <EntityPage type={page} rows={filtered} search={search} setSearch={setSearch}
            loading={loading} onCreate={() => openCreate(page)} onEdit={row => openEdit(page, row)}
            onDelete={row => removeEntity(page, row)}
            onToggle={page === 'profissionais' ? toggleProfessional : null} />}
        {page === 'empresas' && <CompaniesPage rows={empresas} onCreate={() => openCreate('empresas')} onEdit={row => openEdit('empresas', row)} />}
        {page === 'agendamentos' && <AppointmentPage data={data} appointment={appointment} setAppointment={setAppointment} onSubmit={createAppointment} />}
      </>}

      <footer>RPV Barbearia <span>•</span> Interface conectada à API NestJS</footer>
    </main>

    {modal && <EntityModal modal={modal} form={form} setForm={setForm} onClose={() => setModal(null)} onSubmit={saveEntity} />}
  </div>;
}

function Dashboard({ empresa, data, loading, setPage }) {
  return <div className="content">
    <div className="welcome-card">
      <div><span className="eyebrow gold">VISÃO GERAL</span><h2>Bem-vindo à gestão{empresa?.nome ? `, ${empresa.nome}` : ''}.</h2>
      <p>Gerencie clientes, equipe, serviços e novos horários em um só lugar.</p></div>
      <div className="welcome-symbol">✂</div>
    </div>
    <div className="stats-grid">
      <Stat title="Clientes cadastrados" value={data.clientes.length} icon="♙" />
      <Stat title="Profissionais" value={data.profissionais.length} icon="✂" />
      <Stat title="Serviços disponíveis" value={data.servicos.length} icon="◇" />
      <Stat title="Profissionais ativos" value={data.profissionais.filter(p => p.ativo).length} icon="✓" />
    </div>
    <section className="panel quick-panel"><div className="section-heading"><div><span className="eyebrow">ATALHOS</span><h2>Acesso rápido</h2></div></div>
      <div className="quick-grid">
        <Quick title="Novo agendamento" text="Reserve um horário para um cliente" icon="▦" onClick={() => setPage('agendamentos')} />
        <Quick title="Cadastrar cliente" text="Adicione um cliente à barbearia" icon="♙" onClick={() => setPage('clientes')} />
        <Quick title="Gerenciar equipe" text="Consulte seus profissionais" icon="✂" onClick={() => setPage('profissionais')} />
        <Quick title="Editar serviços" text="Atualize preços e duração" icon="◇" onClick={() => setPage('servicos')} />
      </div>
    </section>
    {loading && <p className="muted">Atualizando informações...</p>}
  </div>;
}
function Stat({ title, value, icon }) {
  return <div className="stat-card"><div className="stat-icon">{icon}</div><span>{title}</span><strong>{value}</strong></div>;
}
function Quick({ title, text, icon, onClick }) {
  return <button className="quick-item" onClick={onClick}><span className="quick-icon">{icon}</span><span><strong>{title}</strong><small>{text}</small></span><b>→</b></button>;
}

function EntityPage({ type, rows, search, setSearch, loading, onCreate, onEdit, onDelete, onToggle }) {
  const title = LABELS[type] + 's';
  return <div className="content">
    <div className="section-heading page-heading"><div><span className="eyebrow">CADASTROS</span><h2>{title}</h2><p>Consulte e mantenha os dados atualizados.</p></div>
      <button className="button primary" onClick={onCreate}>＋ Novo {LABELS[type].toLowerCase()}</button></div>
    <div className="toolbar"><div className="search-box"><span>⌕</span><input placeholder={`Buscar ${title.toLowerCase()}...`} value={search} onChange={e => setSearch(e.target.value)} /></div><span className="result-count">{rows.length} registro(s)</span></div>
    <div className="panel table-panel">
      {loading ? <div className="table-empty">Carregando...</div> : rows.length === 0 ? <div className="table-empty"><strong>Nenhum registro encontrado</strong><span>Cadastre o primeiro item para começar.</span></div> :
      <div className="table-scroll"><table><thead><tr>
        <th>Nome</th>{type === 'clientes' && <th>Telefone</th>}
        {type === 'servicos' && <><th>Preço</th><th>Duração</th></>}
        {type === 'profissionais' && <th>Status</th>}<th className="actions-col">Ações</th>
      </tr></thead><tbody>{rows.map(row => <tr key={row.id}>
        <td><strong>{row.nome}</strong><small className="row-id">ID #{row.id}</small></td>
        {type === 'clientes' && <td>{row.telefone}</td>}
        {type === 'servicos' && <><td>{money(row.preco)}</td><td>{row.duracaoMin} min</td></>}
        {type === 'profissionais' && <td><span className={`pill ${row.ativo ? 'pill-green' : 'pill-gray'}`}>{row.ativo ? 'Ativo' : 'Inativo'}</span></td>}
        <td className="actions">
          {onToggle && <button className="text-action" onClick={() => onToggle(row)}>{row.ativo ? 'Desativar' : 'Ativar'}</button>}
          <button className="text-action" onClick={() => onEdit(row)}>Editar</button>
          <button className="text-action danger-text" onClick={() => onDelete(row)}>Excluir</button>
        </td>
      </tr>)}</tbody></table></div>}
    </div>
  </div>;
}

function CompaniesPage({ rows, onCreate, onEdit }) {
  return <div className="content">
    <div className="section-heading page-heading"><div><span className="eyebrow">CONFIGURAÇÃO</span><h2>Empresas</h2><p>Cadastre e configure as barbearias que utilizam o sistema.</p></div>
      <button className="button primary" onClick={onCreate}>＋ Nova empresa</button></div>
    <div className="company-grid">{rows.map(row => <article className="company-card" key={row.id}>
      <div className="company-card-icon">▣</div><span className={`pill ${row.ativa ? 'pill-green' : 'pill-gray'}`}>{row.ativa ? 'Ativa' : 'Inativa'}</span>
      <h3>{row.nome}</h3><p>CNPJ: {row.cnpj}</p><p>Telefone: {row.telefone || 'Não informado'}</p>
      <button className="button secondary full" onClick={() => onEdit(row)}>Editar empresa</button>
    </article>)}
    {!rows.length && <div className="panel table-empty">Nenhuma empresa cadastrada. Crie a primeira empresa.</div>}</div>
  </div>;
}

function AppointmentPage({ data, appointment, setAppointment, onSubmit }) {
  const selectedServices = data.servicos.filter(s => appointment.servicoIds.includes(String(s.id)));
  const total = selectedServices.reduce((sum, s) => sum + Number(s.preco), 0);
  const duration = selectedServices.reduce((sum, s) => sum + Number(s.duracaoMin), 0);
  const update = (key, value) => setAppointment(old => ({ ...old, [key]: value }));
  function toggleService(id) {
    const value = String(id);
    update('servicoIds', appointment.servicoIds.includes(value)
      ? appointment.servicoIds.filter(x => x !== value) : [...appointment.servicoIds, value]);
  }
  return <div className="content">
    <div className="section-heading page-heading"><div><span className="eyebrow">AGENDA</span><h2> Novo agendamento</h2><p>Selecione cliente, profissional, data e serviços.</p></div></div>
    <div className="appointment-layout">
      <form className="panel form-panel" onSubmit={onSubmit}>
        <div className="form-section-title"><span>01</span><div><strong>Dados do atendimento</strong><small>Quem será atendido e por quem?</small></div></div>
        <label>Cliente<select required value={appointment.clienteId} onChange={e => update('clienteId', e.target.value)}><option value="">Selecione um cliente</option>{data.clientes.map(c => <option key={c.id} value={c.id}>{c.nome} — {c.telefone}</option>)}</select></label>
        <label>Profissional<select required value={appointment.profissionalId} onChange={e => update('profissionalId', e.target.value)}><option value="">Selecione um profissional</option>{data.profissionais.filter(p => p.ativo).map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></label>
        <label>Data e horário<input type="datetime-local" required value={appointment.inicio} onChange={e => update('inicio', e.target.value)} /></label>
        <div className="form-section-title second"><span>02</span><div><strong>Serviços</strong><small>Você pode selecionar mais de um serviço.</small></div></div>
        <div className="service-options">{data.servicos.map(s => <label className={`service-option ${appointment.servicoIds.includes(String(s.id)) ? 'selected' : ''}`} key={s.id}>
          <input type="checkbox" checked={appointment.servicoIds.includes(String(s.id))} onChange={() => toggleService(s.id)} />
          <span><strong>{s.nome}</strong><small>{s.duracaoMin} minutos</small></span><b>{money(s.preco)}</b>
        </label>)}</div>
        {!data.servicos.length && <p className="muted">Cadastre serviços antes de criar um agendamento.</p>}
        <button className="button primary full submit-appointment" disabled={!data.clientes.length || !data.profissionais.some(p => p.ativo) || !data.servicos.length}>Criar agendamento</button>
      </form>
      <aside className="panel summary-panel"><span className="eyebrow">RESUMO</span><h3>Seu atendimento</h3>
        <div className="summary-line"><span>Serviços selecionados</span><strong>{selectedServices.length}</strong></div>
        <div className="summary-line"><span>Duração total</span><strong>{duration} min</strong></div>
        <div className="summary-line total"><span>Valor estimado</span><strong>{money(total)}</strong></div>
        <p className="summary-note">O backend calcula o horário final automaticamente com base na duração dos serviços e verifica conflitos de agenda do profissional.</p>
        <div className="notice-box">A listagem e consulta de agendamentos ainda não estão implementadas no backend enviado. Esta tela realiza somente a criação.</div>
      </aside>
    </div>
  </div>;
}

function EntityModal({ modal, form, setForm, onClose, onSubmit }) {
  const type = modal.type;
  const fields = type === 'empresas'
    ? [['nome', 'Nome da empresa', 'text'], ['cnpj', 'CNPJ (12 letras/números + 2 dígitos)', 'text'], ['telefone', 'Telefone', 'tel']]
    : type === 'clientes'
      ? [['nome', 'Nome completo', 'text'], ['telefone', 'Telefone com DDD (somente números)', 'tel']]
      : type === 'profissionais'
        ? [['nome', 'Nome do profissional', 'text']]
        : [['nome', 'Nome do serviço', 'text'], ['preco', 'Preço (R$)', 'number'], ['duracaoMin', 'Duração em minutos', 'number']];
  return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <form className="modal-card" onSubmit={onSubmit}>
      <div className="modal-heading"><div><span className="eyebrow">{modal.mode === 'create' ? 'NOVO CADASTRO' : 'EDITAR CADASTRO'}</span><h2>{modal.mode === 'create' ? 'Cadastrar' : 'Editar'} {LABELS[type].toLowerCase()}</h2></div><button type="button" className="close-button" onClick={onClose}>×</button></div>
      {fields.map(([key, label, inputType]) => <label key={key}>{label}
        <input autoFocus={key === fields[0][0]} type={inputType} required={key !== 'telefone' || type === 'clientes'}
          min={inputType === 'number' ? (key === 'preco' ? '0.01' : '5') : undefined}
          step={key === 'preco' ? '0.01' : inputType === 'number' ? '1' : undefined}
          value={form[key] ?? ''} onChange={e => setForm(old => ({ ...old, [key]: e.target.value }))} />
      </label>)}
      {type === 'empresas' && modal.mode === 'edit' && <label className="checkbox-label"><input type="checkbox" checked={form.ativa !== false} onChange={e => setForm(old => ({ ...old, ativa: e.target.checked }))} /> Empresa ativa</label>}
      <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>Cancelar</button><button className="button primary">{modal.mode === 'create' ? 'Salvar cadastro' : 'Salvar alterações'}</button></div>
    </form>
  </div>;
}