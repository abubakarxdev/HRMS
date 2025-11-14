# HRIS Pro Backend

This directory contains the Node.js, Express, and PostgreSQL backend for the HRIS Pro application.

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or later)
- [PostgreSQL](https://www.postgresql.org/)

## Setup Instructions

### 1. Install Dependencies

Navigate to the `backend` directory and run:

```bash
npm install
```

### 2. Set Up the Database

1.  Make sure your PostgreSQL server is running.
2.  Create a new database. You can use a GUI like pgAdmin or the `psql` command line:
    ```sql
    CREATE DATABASE hris_pro_db;
    ```
3.  **Important:** Create a `.env` file in the `backend` directory by copying the `.env.example` file (if provided) or creating a new one. Update the `DATABASE_URL` with your PostgreSQL connection details (username, password, host, port, and database name).

    Example `.env` content:
    ```
    PORT=5001
    DATABASE_URL=postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/hris_pro_db
    JWT_SECRET=a_very_secret_and_long_key_for_jwt
    JWT_EXPIRES_IN=1d
    ```

### 3. Initialize the Database Schema and Seed Data

A script is provided to create all necessary tables and populate them with initial mock data (including users with hashed passwords).

Run the following command from the `backend` directory:

```bash
npm run db:init
```

This will execute the `src/database/init-db.js` script, which reads and runs the SQL commands from `src/database/schema.sql` and `src/database/seed.sql`.

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
