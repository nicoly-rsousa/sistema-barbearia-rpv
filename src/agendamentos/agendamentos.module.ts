import { Module } from '@nestjs/common';
import { AgendamentosService } from './agendamentos.service.js';
import { AgendamentosController } from './agendamentos.controller.js';
import { EmpresasModule } from '../empresas/empresas.module.js';

// Adriana: registra controller e service de agendamentos e importa EmpresasModule para validar a empresa ativa.
@Module({
  controllers: [AgendamentosController],
  providers: [AgendamentosService],
  imports: [EmpresasModule]
})
export class AgendamentosModule { }
