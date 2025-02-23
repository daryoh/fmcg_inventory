import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class GetProductsFilterDto {
  @IsUUID()
  @IsOptional()
  @ApiProperty({ description: 'User id', required: false })
  userId?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'Product name', required: false })
  title?: string;
}
