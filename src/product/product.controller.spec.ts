import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { faker } from '@faker-js/faker';
import { IAuthResponse, IErrorResponse } from '../auth/auth.controller.spec';

interface IProduct {
  title: string;
  description: string;
  quantity: number;
  price: number;
  user: {
    id: string;
  };
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
interface IProductResponse {
  message: string;
  product?: IProduct;
}
interface IProductsResponse {
  message: string;
  data: IProduct[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

describe('ProductController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let productId: string;
  let ownerId: string;

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

    const user = {
      email: 'test-user@example.com',
      password: 'testPassword@123',
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
    };

    // register user
    const response = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send(user);

    const responseBody = response.body as IAuthResponse;
    accessToken = responseBody.accessToken;
    expect(accessToken).toBeDefined();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/v1/products (POST) - should create a product when authenticated', async () => {
    const productData = {
      title: 'Test Product',
      description: 'A sample product',
      price: 100.5,
      quantity: 10,
    };

    const response = await request(app.getHttpServer())
      .post('/v1/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(productData);

    const responseBody = response.body as IProductResponse;

    productId = responseBody.product.id;
    ownerId = responseBody.product.user.id;

    expect(response.status).toBe(201);
    expect(responseBody).toHaveProperty('product');
    expect(responseBody.message).toBe('Product created successfully');
    expect(responseBody.product.title).toBe(productData.title);
    expect(Number(responseBody.product.price)).toBe(productData.price);
  });

  it('/v1/products (POST) - should fail to create a product with invalid or missing field', async () => {
    const productData = {
      description: 'A sample product',
      price: 100.5,
      quantity: 10,
    };

    const response = await request(app.getHttpServer())
      .post('/v1/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(productData);

    const responseBody = response.body as IErrorResponse;

    expect(response.statusCode).toBe(400);
    expect(responseBody.error).toBe('Bad Request');
  });

  it('/v1/products (GET) - should fetch all products when authenticated', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/products')
      .set('Authorization', `Bearer ${accessToken}`);

    const responseBody = response.body as IProductsResponse;

    expect(response.status).toBe(200);
    expect(responseBody).toHaveProperty('data');
    expect(Array.isArray(responseBody.data)).toBeTruthy();
  });

  it('/v1/products (GET) - should fetch all products with filters', async () => {
    const response = await request(app.getHttpServer())
      .get(`/v1/products?page=1&pageSize=10&title=Test&userId=${ownerId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    const responseBody = response.body as IProductsResponse;

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(Array.isArray(responseBody.data)).toBeTruthy();
  });

  it('/v1/products (POST) - should fail if no token is provided', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/products')
      .send({
        title: 'Unauthorized Product',
        price: 50,
        quantity: 5,
      });

    expect(response.status).toBe(401); // Unauthorized
  });

  it('/v1/products (GET) - should fail if no token is provided', async () => {
    const response = await request(app.getHttpServer()).get('/v1/products');
    expect(response.status).toBe(401);
  });

  it('/v1/products (GET) - should successful return a single product', async () => {
    const response = await request(app.getHttpServer())
      .get(`/v1/products/${productId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
  });

  it('/v1/products (GET) - should fail if product id provided is invalid id', async () => {
    const invalidID = faker.string.uuid();
    const response = await request(app.getHttpServer())
      .get(`/v1/products/${invalidID}`)
      .set('Authorization', `Bearer ${accessToken}`);

    const responseBody = response.body as IErrorResponse;
    expect(response.status).toBe(404);
    expect(responseBody.message).toBe('Not Found');
  });

  it('/v1/products (PUt) - should fail to update a product with invalid id', async () => {
    const invalidID = faker.string.uuid();
    const productData = {
      description: 'A sample product updated',
    };
    const response = await request(app.getHttpServer())
      .put(`/v1/products/${invalidID}`)
      .send(productData)
      .set('Authorization', `Bearer ${accessToken}`);

    const responseBody = response.body as IErrorResponse;
    expect(response.status).toBe(404);
    expect(responseBody.message).toBe('Not Found');
  });

  it('/v1/products (PUt) - should update a product with a valid id', async () => {
    const productData = {
      description: 'A sample product updated',
    };
    const response = await request(app.getHttpServer())
      .put(`/v1/products/${productId}`)
      .send(productData)
      .set('Authorization', `Bearer ${accessToken}`);

    const responseBody = response.body as IProductResponse;
    expect(response.status).toBe(200);
    expect(responseBody.message).toBe('Product updated successfully');
  });

  it('/v1/products (DELETE) - should fail to delete a product with invalid id', async () => {
    const invalidID = faker.string.uuid();
    const response = await request(app.getHttpServer())
      .delete(`/v1/products/${invalidID}`)
      .set('Authorization', `Bearer ${accessToken}`);

    const responseBody = response.body as IErrorResponse;
    expect(response.status).toBe(404);
    expect(responseBody.message).toBe('Not Found');
  });

  it('/v1/products (DELETE) - should  delete a product with valid id', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/v1/products/${productId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    const responseBody = response.body as IProductResponse;
    expect(response.status).toBe(200);
    expect(responseBody.message).toBe('Product deleted successfully');
  });
});
