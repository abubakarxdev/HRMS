# HRIS Pro Backend

This directory contains the Node.js, Express, and PostgreSQL backend for the HRIS Pro application, using Prisma as the ORM.

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or later)
- [PostgreSQL](https://www.postgresql.org/)
- [Docker](https://www.docker.com/) (Optional, for running PostgreSQL in a container)

## Setup Instructions

### 1. Install Dependencies

Navigate to the `backend` directory and run:

```bash
npm install
```

### 2. Set Up Environment Variables

1.  Make sure your PostgreSQL server is running.
2.  Create a new database. You can use a GUI like pgAdmin or the `psql` command line:
    ```sql
    CREATE DATABASE hris_pro_db;
    ```
3.  Create a `.env` file in the `backend` directory. You can copy the structure below.
4.  Update the `DATABASE_URL` with your PostgreSQL connection string (username, password, host, port, and database name).

    **`.env` content:**
    ```
    # Server Configuration
    PORT=5001

    # Database URL for Prisma
    DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/hris_pro_db"

    # JWT Configuration
    JWT_SECRET="a_very_secret_and_long_key_for_jwt_32_chars_long"
    JWT_EXPIRES_IN="1d"
    ```

### 3. Initialize and Seed the Database with Prisma

A single command is provided to set up and seed your database using Prisma. It will:
1.  Read your `prisma/schema.prisma` file.
2.  Create a new migration to build the database schema.
3.  Apply the migration to your database.
4.  Run the `prisma/seed.js` script to populate the database with initial data.

Run the following command from the `backend` directory:

```bash
npm run db:init
```
This command runs `prisma migrate dev` and `prisma db seed`.

You will also need to generate the Prisma Client after installing dependencies or changing the schema:
```bash
npx prisma generate
```

### 4. Start the Server

You can start the server in two modes:

-   **Development Mode (with auto-reloading):**
    ```bash
    npm run dev
    ```
    This uses `nodemon` to automatically restart the server when you make changes to the code.

-   **Production Mode:**
    ```bash
    npm start
    ```

The server will start on the port specified in your `.env` file (default is `5001`). The API will be available at `http://localhost:5001/api`.
