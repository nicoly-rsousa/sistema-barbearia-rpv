import { ArrayNotEmpty, ArrayUnique, IsArray, IsDateString, IsInt } from "class-validator";

// Adriana: valida os dados necessários para marcar um atendimento.
export class CreateAgendamentoDto {
    @IsInt({ message: "clienteId deve ser um número inteiro" })
    clienteId: number;

    @IsInt({ message: "profissionalId deve ser um número inteiro" })
    profissionalId: number;

    @IsDateString({}, { message: "inicio deve ser uma data válida" })
    inicio: string;

    @IsArray({ message: "servicoIds deve ser uma lista" })
    @ArrayNotEmpty({ message: "Selecione ao menos um serviço" })
    @ArrayUnique({ message: "Não repita o mesmo serviço" })
    @IsInt({ each: true, message: "Cada serviço deve ter um identificador inteiro" })
    servicoIds: number[];
}
