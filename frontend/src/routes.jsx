import { Navigate, Route, Routes } from 'react-router-dom'
import { useEmpresa } from './context/EmpresaContext.jsx'
import Layout from './layout/Layout.jsx'
import EmpresasPage from './pages/empresas/EmpresasPage.jsx'
import ServicosPage from './pages/servicos/ServicosPage.jsx'
import DashboardPage from './pages/dashboard/DashboardPage.jsx'
import NovoAgendamentoPage from './pages/agendamentos/NovoAgendamentoPage.jsx'
import ClientesPage from './pages/clientes/ClientesPage.jsx'
import ProfissionaisPage from './pages/profissionais/ProfissionaisPage.jsx'

// Só deixa entrar nas telas do sistema se já houver uma empresa selecionada.
function ExigeEmpresa() {
  const { empresa } = useEmpresa()
  if (!empresa) return <Navigate to="/empresas" replace />
  return <Layout />
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Seleção de empresa: tela inteira, sem menu lateral */}
      <Route path="/empresas" element={<EmpresasPage />} />

      <Route element={<ExigeEmpresa />}>
        {/* Dashboard, Novo agendamento, Clientes e Profissionais são placeholders (outras integrantes) */}
        <Route path="/" element={<DashboardPage />} />
        <Route path="/agendamentos/novo" element={<NovoAgendamentoPage />} />
        <Route path="/clientes" element={<ClientesPage />} />
        <Route path="/profissionais" element={<ProfissionaisPage />} />
        <Route path="/servicos" element={<ServicosPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
