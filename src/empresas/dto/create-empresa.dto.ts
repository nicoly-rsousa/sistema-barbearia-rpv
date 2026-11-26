import { Transform } from 'class-transformer'
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator'

const normalizarCnpj = ({ value }: { value: unknown }) => {
    return typeof value === 'string' ? value.replace(/[.\/-]/g, '').toUpperCase() : value
}

export class CreateEmpresaDto {
    @IsString({ message: "O nome da empresa deve ser um texto" })
    @IsNotEmpty({ message: "O nome da empresa é obrigatório" })
    nome: string;

    @Transform(normalizarCnpj)
    @Matches(/^[A-Z0-9]{12}\d{2}$/, {
        message: "CNPJ deve ter 12 letras ou números seguidos de 2 dígitos"
    })
    cnpj: string;

    @IsOptional()
    @IsString({ message: "O telefone deve ser um texto" })
    telefone?: string;
}
