import { IsInt, IsNotEmpty, IsNumber, IsPositive, IsString, Min } from "class-validator";

export class CreateServicoDto {
    @IsString({ message: "O nome do serviço deve ser um texto" })
    @IsNotEmpty({ message: "O nome do serviço é obrigatório" })
    nome: string;

    // @IsNumber({ maxDecimalPlaces: 2 })
    @IsPositive({ message: "O preço deve ser um número maior que zero" })
    preco: number;

    @IsInt({ message: "A duração deve ser um número inteiro de minutos" })
    @Min(5, { message: "A duração mínima é de 5 minutos" })
    duracaoMin: number;
}
