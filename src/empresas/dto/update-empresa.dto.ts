import { PartialType } from '@nestjs/mapped-types';
import { CreateEmpresaDto } from './create-empresa.dto.js';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateEmpresaDto extends PartialType(CreateEmpresaDto) {
    @IsOptional()
    @IsBoolean({ message: "O campo ativa deve ser verdadeiro ou falso" })
    ativa?: boolean
}
