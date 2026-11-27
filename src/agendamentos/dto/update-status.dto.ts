import { IsIn } from "class-validator";

// Adriana: lista os status finais aceitos no PATCH (AGENDADO fica de fora de propósito).
export const STATUS_FINAIS = ["CANCELADO", "CONCLUIDO", "FALTOU"] as const;
export type StatusFinal = (typeof STATUS_FINAIS)[number];

// Adriana: valida o status enviado ao encerrar um atendimento, com mensagem em português.
export class UpdateStatusDto {
    @IsIn([...STATUS_FINAIS], {
        message: "status deve ser CONCLUIDO, CANCELADO ou FALTOU",
    })
    status: StatusFinal;
}