import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Em desenvolvimento, o Vite encaminha as chamadas para o NestJS.
// Assim, o navegador acessa o frontend na porta 5173 e a API na 3000
// sem exigir configuração de CORS no backend.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/empresas': 'http://localhost:3000',
      '/clientes': 'http://localhost:3000',
      '/profissionais': 'http://localhost:3000',
      '/servicos': 'http://localhost:3000',
      '/agendamentos': 'http://localhost:3000'
    }
  }
});