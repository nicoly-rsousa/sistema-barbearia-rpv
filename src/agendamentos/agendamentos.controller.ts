import { Controller, Get, Post, Body, Patch, Param, ParseIntPipe, Query } from '@nestjs/common';
import { AgendamentosService } from './agendamentos.service.js';
import { CreateAgendamentoDto } from './dto/create-agendamento.dto.js';
import { UpdateStatusDto } from './dto/update-status.dto.js';
import { AgendaQueryDto } from './dto/agenda-query.dto.js';
import { EmpresaId } from '../common/empresa-id.decorator.js';

@Controller('agendamentos')
export class AgendamentosController {
  constructor(private readonly agendamentosService: AgendamentosService) { }

  @Post()
  create(@EmpresaId() empresaId: number, @Body() dto: CreateAgendamentoDto) {
    return this.agendamentosService.create(empresaId, dto);
  }

  // Adriana: lista os agendamentos da empresa e aplica o filtro de status solicitado.
  @Get()
  findAll(@EmpresaId() empresaId: number, @Query('status') status?: string) {
    return this.agendamentosService.findAll(empresaId, status);
  }

  // Adriana: consulta os horários ocupados de um profissional antes da rota dinâmica por ID.
  @Get('agenda')
  agenda(@EmpresaId() empresaId: number, @Query() query: AgendaQueryDto) {
    return this.agendamentosService.agenda(empresaId, query);
  }

  // Adriana: atualiza o resultado do atendimento usando um identificador inteiro.
  @Patch(':id/status')
  atualizarStatus(
    @EmpresaId() empresaId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.agendamentosService.atualizarStatus(empresaId, id, dto);
  }

  // Adriana: consulta um agendamento somente dentro da empresa selecionada.
  @Get(':id')
  findOne(@EmpresaId() empresaId: number, @Param('id', ParseIntPipe) id: number) {
    return this.agendamentosService.findOne(empresaId, id);
  }
}
