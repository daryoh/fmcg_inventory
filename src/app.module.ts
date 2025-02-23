import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { configValidationSchema } from '../config.schema';
import { ProductModule } from './product/product.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env'],
      validationSchema: configValidationSchema,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const isTest = process.env.NODE_ENV === 'test';

        return {
          autoLoadEntities: true,
          type: 'postgres',
          database: isTest
            ? configService.get<string>('DATABASE_NAME_TEST')
            : configService.get<string>('DATABASE_NAME'),
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DATABASE_PORT'),
          username: configService.get<string>('DATABASE_USER'),
          password: configService.get<string>('DATABASE_PASSWORD'),
          entities: [__dirname + '/../**/*.entity.{ts,js}'],
          migrations: [__dirname + '/src/migrations/*.{js,ts}'],
          synchronize: isTest, // Auto-sync only for tests
          dropSchema: isTest,
        } as TypeOrmModuleAsyncOptions;
      },
    }),
    AuthModule,
    ProductModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
