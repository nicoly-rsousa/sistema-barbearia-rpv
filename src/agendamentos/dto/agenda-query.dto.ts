import { Type } from "class-transformer";
import { IsInt, Matches } from "class-validator";

// Adriana: valida profissional e data usados para consultar a agenda diária.
export class AgendaQueryDto {
    @Type(() => Number)
    @IsInt({ message: "profissionalId deve ser um número inteiro" })
    profissionalId: number;

    @Matches(/^\d{4}-\d{2}-\d{2}$/, {
        message: "data deve estar no formato AAAA-MM-DD",
    })
    data: string;
}
