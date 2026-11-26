import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useEmpresa } from '../context/EmpresaContext.jsx'

// Estrutura comum das telas: menu lateral, cabeçalho com a empresa atual e área de conteúdo.
const ITENS_MENU = [
  { para: '/', rotulo: 'Dashboard', fim: true },
  { para: '/agendamentos/novo', rotulo: 'Agendamento' },
  { para: '/clientes', rotulo: 'Cliente' },
  { para: '/profissionais', rotulo: 'Profissional' },
  { para: '/servicos', rotulo: 'Serviço' },
]

export default function Layout() {
  const { empresa, limpar } = useEmpresa()
  const navigate = useNavigate()

  // Limpa a empresa atual e volta para a tela de seleção
  function alterarEmpresa() {
    limpar()
    navigate('/empresas')
  }

  return (
    <div className="app">
      <aside className="menu">
        <div className="menu-marca">Barbearia</div>
        <nav className="menu-itens">
          {ITENS_MENU.map((item) => (
            <NavLink
              key={item.para}
              to={item.para}
              end={item.fim}
              className={({ isActive }) => `menu-link${isActive ? ' ativo' : ''}`}
            >
              {item.rotulo}
            </NavLink>
          ))}
        </nav>
        <button type="button" className="menu-link menu-alterar" onClick={alterarEmpresa}>
          Alterar empresa
        </button>
      </aside>

      <div className="principal">
        <header className="cabecalho">
          <span className="cabecalho-rotulo">Empresa atual</span>
          <strong className="cabecalho-empresa">{empresa?.nome}</strong>
        </header>
        <main className="conteudo">
          {/* A chave faz as telas recarregarem os dados se a empresa mudar */}
          <Outlet key={empresa?.id} />
        </main>
      </div>
    </div>
  )
}
