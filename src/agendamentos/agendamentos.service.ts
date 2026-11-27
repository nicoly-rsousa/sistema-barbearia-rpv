import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateAgendamentoDto } from './dto/create-agendamento.dto.js';
import { UpdateStatusDto } from './dto/update-status.dto.js';
import { AgendaQueryDto } from './dto/agenda-query.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { EmpresasService } from '../empresas/empresas.service.js';

// Adriana: inclui cliente, profissional e serviços nos retornos usados pela recepção.
const DETALHES = {
  cliente: { select: { id: true, nome: true, telefone: true } },
  profissional: { select: { id: true, nome: true } },
  servicos: {
    include: {
      servico: { select: { id: true, nome: true, duracaoMin: true } },
    }
  }
};

// Adriana: limita o filtro da lista aos quatro status existentes no banco.
const STATUS_VALIDOS = ['AGENDADO', 'CONCLUIDO', 'CANCELADO', 'FALTOU'] as const;
type StatusAgendamento = (typeof STATUS_VALIDOS)[number];

// Adriana: exibe os horários de conflito no formato usado pela recepção.
const hora = (d: Date) =>
  d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

@Injectable()
export class AgendamentosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly empresas: EmpresasService
  ) { }

  // Adriana: valida empresa, cliente, profissional, serviços, horário e conflito antes de salvar.
  async create(empresaId: number, dto: CreateAgendamentoDto) {
    await this.empresas.validarEmpresaAtiva(empresaId);

    const inicio = new Date(dto.inicio);
    if (inicio <= new Date()) {
      throw new BadRequestException('Não é possível agendar numa data antiga');
    }

    const cliente = await this.prisma.cliente.findFirst({
      where: { empresaId, id: dto.clienteId }
    });

    if (!cliente) {
      throw new NotFoundException("Cliente não encontrado nesta empresa");
    }

    const profissional = await this.prisma.profissional.findFirst({
      where: { id: dto.profissionalId, empresaId }
    });

    if (!profissional) {
      throw new NotFoundException("Profissional não encontrado nesta empresa");
    }

    if (!profissional.ativo) {
      throw new NotFoundException("Profissional inativo não recebe agendamentos");
    }

    const servicos = await this.prisma.servico.findMany({
      where: { empresaId, id: { in: dto.servicoIds } }
    });

    if (servicos.length !== dto.servicoIds.length) {
      throw new NotFoundException("Serviço não encontrado nesta empresa");
    }

    const duracaoTotal = servicos.reduce((soma, s) => soma + s.duracaoMin, 0);
    const fim = new Date(inicio.getTime() + duracaoTotal * 60_000);

    const conflito = await this.prisma.agendamento.findFirst({
      where: {
        empresaId,
        profissionalId: dto.profissionalId,
        status: 'AGENDADO',
        inicio: { lt: fim },
        fim: { gt: inicio }
      }
    });

    if (conflito) {
      throw new ConflictException(
        `${profissional.nome} já tem atendimento das ` + `${hora(conflito.inicio)} às ${hora(conflito.fim)}`
      );
    }

    return this.prisma.agendamento.create({
      data: {
        inicio,
        fim,
        empresaId,
        clienteId: dto.clienteId,
        profissionalId: dto.profissionalId,
        servicos: {
          create: servicos.map((s) => ({
            servicoId: s.id,
            precoCobrado: s.preco
          }))
        }
      },
      include: DETALHES
    });
  }

  // Adriana: lista os atendimentos da empresa, em ordem de início, com os dados usados nos cards.
  findAll(empresaId: number, status?: string) {
    if (status !== undefined && !(STATUS_VALIDOS as readonly string[]).includes(status)) {
      throw new BadRequestException('Status inválido');
    }

    return this.prisma.agendamento.findMany({
      where: {
        empresaId,
        ...(status !== undefined ? { status: status as StatusAgendamento } : {})
      },
      orderBy: { inicio: 'asc' },
      include: DETALHES
    });
  }

  // Adriana: encontra um agendamento da empresa selecionada e responde 404 quando ele não pertence a ela.
  async findOne(empresaId: number, id: number) {
    const agendamento = await this.prisma.agendamento.findFirst({
      where: { id, empresaId },
      include: DETALHES
    });

    if (!agendamento) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    return agendamento;
  }

  // Adriana: finaliza um atendimento uma única vez e impede alteração após o primeiro desfecho.
  async atualizarStatus(empresaId: number, id: number, dto: UpdateStatusDto) {
    const agendamento = await this.prisma.agendamento.findFirst({
      where: { id, empresaId },
      select: { id: true, status: true }
    });

    if (!agendamento) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    if (agendamento.status !== 'AGENDADO') {
      throw new ConflictException('Este agendamento já foi finalizado');
    }

    const resultado = await this.prisma.agendamento.updateMany({
      where: { id, empresaId, status: 'AGENDADO' },
      data: { status: dto.status }
    });

    if (resultado.count === 0) {
      throw new ConflictException('Este agendamento já foi finalizado');
    }

    return this.findOne(empresaId, id);
  }

  // Adriana: devolve os intervalos ocupados no dia civil informado, interpretado no fuso -03:00.
  async agenda(empresaId: number, query: AgendaQueryDto) {
    const [ano, mes, dia] = query.data.split('-').map(Number);
    const dataUtc = new Date(Date.UTC(ano, mes - 1, dia));
    if (
      dataUtc.getUTCFullYear() !== ano ||
      dataUtc.getUTCMonth() !== mes - 1 ||
      dataUtc.getUTCDate() !== dia
    ) {
      throw new BadRequestException('Data inválida');
    }

    const inicioDia = new Date(`${query.data}T00:00:00.000-03:00`);
    const fimDia = new Date(inicioDia.getTime() + 24 * 60 * 60 * 1000);

    return this.prisma.agendamento.findMany({
      where: {
        empresaId,
        profissionalId: query.profissionalId,
        status: 'AGENDADO',
        inicio: { lt: fimDia },
        fim: { gt: inicioDia }
      },
      select: { inicio: true, fim: true },
      orderBy: { inicio: 'asc' }
    });
  }
}
