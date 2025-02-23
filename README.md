## Description

A simple nestjs api for FMCG.

## Getting Started

### Prerequisites

- Install NodeJS (v16+) and **Yarn** or **npm**
- Install **PostgreSQL** (or ensure SQLite is used for testing)

### Environment Setup

- Use the `.env.example` file to setup your environmental variables
  - Setup the root [`.env`](./.env) file. `cp .env.example .env`
- This projects requires two `.env` files, one for test `.env.test` and the other for development `.env`

### Install dependencies

- Run `npm install` or `yarn install` to install all dependencies

### Running the Server

- Run `yarn run start:dev` to start the server locally
- Run `yarn run start` to start the server after build
- Interact with localhost:[PORT] in POSTMAN to access the application

## Testing

- run test `npm test` or `yarn test`
- run test with code coverage `yarn run test:cov`
- Testing Environment:
  - Uses SQLite for testing (configured via .env.test).
  - The test database is reset automatically before each test.

## Documentation

- Once the server is running, access the Swagger UI at: `http://localhost:3000/api/docs`

## Features

### Authentication

- Register User: `POST /v1/auth/register`
- Login User: `POST /v1/auth/login`

### Product Management

- Create Product: `POST /v1/products`
- Delete a Product: `DELETE /v1/products/:id`
- Edit a Product: `PUT /v1/products/:id`
- Get all Products: `GET /v1/products`
- Get a Product: `GET /v1/products/:id`

## Design Decisions & Trade-offs

- Decision: I used PostgreSQL for a production-ready setup with better scalability.
- Trade-off: Requires more setup than SQLite, but supports advanced features like indexing and transactions.

- Decision: Using PostgresSQL instead of SQLite for Testing
  - Reasoning: I wanted to use SQLite for testing because it provides a lightweight, in-memory database, making tests faster and isolated without requiring a full PostgreSQL instance. However, I experienced installation issues with SQLite on my machine.
- Trade-off:
  - Issue: Some PostgreSQL-specific constraints (like unique constraints) behave differently in SQLite.
  - Example: I relied on database duplicate errors (error code 23505 in PostgreSQL), but SQLite throws a different error format for unique constraint violations.
  - Solution: I added a check to handle both PostgreSQL and SQLite errors, ensuring consistent error handling across environments.

## Challenges Faced & Resolutions

1. Challenge: Setting Up Database Config for Tests
   - Issue: Needed separate test and dev databases.
   - Solution: Used `ConfigModule.forRoot()` to load .env.test when `NODE_ENV=test`.
2. Challenge: Ensuring Clean Database for Tests
   - Issue: Tests could fail due to leftover data.
   - Solution: I deleted records from the database using ` await userRepository.delete({})` in `afterAll()` to reset the database before each test.

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
