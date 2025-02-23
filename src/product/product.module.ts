import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/models';
import { LoggerModule } from '../logger/logger.module';
import { Product } from './models';

@Module({
  imports: [LoggerModule, TypeOrmModule.forFeature([User, Product])],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
