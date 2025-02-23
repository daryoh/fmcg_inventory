import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { faker } from '@faker-js/faker';
import { User } from './models';
import { DataSource, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';

export interface IAuthResponse {
  accessToken: string;
  message: string;
}

export interface IErrorResponse {
  message: string;
  error: string;
  statusCode: number;
}

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  const strongPassword =
    faker.string.alphanumeric(6) +
    faker.string.symbol(2) +
    faker.number.int({ min: 10, max: 99 });

  const userPayload = {
    email: 'test-user@example.com',
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableCors();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });

    await app.init();

    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );

    // Seed a test user
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash('testPassword@123', salt);
    await userRepository.save({ ...userPayload, password: hashedPassword });
  });

  afterAll(async () => {
    await userRepository.delete({});
    await app.close();
  });

  describe('/v1/auth (POST)', () => {
    it('should successfully create a new user', async () => {
      const userDto = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        password: strongPassword,
      };

      const response = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send(userDto);

      const responseBody = response.body as IAuthResponse;
      expect(response.statusCode).toBe(201);
      expect(responseBody.accessToken).toBeDefined();
      expect(responseBody.message).toBe('Registration successfully');
    });

    it('should fail to create user if email exists', async () => {
      const userDto = {
        email: 'test-user@example.com',
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        password: strongPassword,
      };

      const response = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send(userDto);

      const responseBody = response.body as IErrorResponse;
      expect(response.statusCode).toBe(409);
      expect(responseBody.message).toBe('User already exists');
      expect(responseBody.error).toBe('Conflict');
    });

    it('should fail to create a new user if a required field is missing', async () => {
      const userDto = {
        firstName: faker.person.fullName(),
        lastName: faker.person.lastName(),
        password: strongPassword,
      };

      const response = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send(userDto);

      const responseBody = response.body as IErrorResponse;
      expect(response.statusCode).toBe(400);
      expect(responseBody.error).toBe('Bad Request');
    });

    it('should successfully login a user', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: userPayload.email, password: 'testPassword@123' });

      const responseBody = response.body as IAuthResponse;
      expect(response.statusCode).toBe(200);
      expect(responseBody.accessToken).toBeDefined();
      expect(responseBody.message).toBe('Login successful');
    });

    it('should fail to login a user', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: userPayload.email, password: 'wrong_password' });

      const responseBody = response.body as IErrorResponse;
      expect(response.statusCode).toBe(401);
      expect(responseBody.error).toBe('Unauthorized');
      expect(responseBody.message).toBe('Invalid credentials');
    });
  });
});
