# HRMS - Enterprise Human Resource Management System

![Status](https://img.shields.io/badge/Status-Production%20Ready-success)
![Version](https://img.shields.io/badge/Version-1.2.0-blue)
![License](https://img.shields.io/badge/License-Proprietary-red)

**HRMS** is a modern, enterprise-grade Human Resource Information System designed for multi-national organizations. It features a robust multi-tenant architecture, strict Role-Based Access Control (RBAC), and a seamless user experience for managing employees, attendance, leaves, and contracts.

---

## 🚀 Key Features

### 🏢 Multi-Tenant Architecture & Security
- **Strict Tenant Isolation**: Data is scoped by **Legal Entity** (Company) and **Office**.
- **Data Privacy**: 
    - Admins/HR can only access data belonging to their assigned Legal Entity.
    - Automatic "Fallback Resolution" for legacy accounts to ensure continuity.
    - System Admins are automatically hidden from the general Employee Directory.

### 👥 Employee Management
- **Comprehensive Profiles**: Personal details, banking info, education, and work history.
- **Contract Management**: Full lifecycle management of employment contracts (Full-time, Part-time, Consultant) with salary history.
- **Directory**: Advanced filtering by Department, Status, and Role.

### 📅 Attendance & Time Tracking
- **Smart Check-in/Out**: Real-time attendance tracking with optional Geofencing support.
- **Break Management**: Track work sessions vs. break times.
- **Timesheets**: Automated calculation of daily, weekly, and monthly work hours.
- **Correction Requests**: Workflow for employees to request attendance corrections.

### 🏖️ Leave Management
- **Workflow Automation**: Request -> Approval -> Balance Deduction.
- **Policy Engine**: Configurable leave policies (Sick, Casual, Annual) per Legal Entity.
- **Overlap Detection**: Smart validation to prevent duplicate leave requests.
- **Dashboard**: Real-time visualization of leave trends and team availability.

---

## 🛠️ Technology Stack

### Frontend (Client)
- **Framework**: React 18 (Vite)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (CDN/JIT) + Framer Motion (Animations)
- **State Management**: React Query (TanStack Query) + Context API
- **Visualization**: Recharts, Chart.js
- **Forms**: React Hook Form + Zod Validation

### Backend (Server)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (Relational)
- **ORM**: Prisma (Type-safe database access)
- **Authentication**: JWT (Access + Refresh Tokens) + BCrypt

---

## 📂 Architecture Overview

The project follows a **Monorepo** structure:

```
HRMS/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── api/            # Axios API services
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route pages
│   │   └── hooks/          # Custom React hooks
│   └── ...
├── server/                 # Node.js Backend
│   ├── src/
│   │   ├── controllers/    # Request handlers (Business Logic)
│   │   ├── services/       # Service Layer (Data manipulation)
│   │   ├── repositories/   # Data Access Layer (Prisma)
│   │   └── middlewares/    # Auth & Validation
│   └── prisma/             # Database Schema & Seeders
└── ...
```

---

## ⚡ Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/abubakarxdev/HRMS.git
    cd HRMS
    ```

2.  **Backend Setup**
    ```bash
    cd server
    npm install
    
    # Configure Environment
    cp .env.example .env
    # Update DATABASE_URL and JWT_SECRET in .env
    
    # Initialize Database
    npm run db:init  # Runs migrations and seed script
    
    # Start Server
    npm run dev
    ```

3.  **Frontend Setup**
    ```bash
    cd ../client
    npm install
    
    # Start Client
    npm run dev
    ```

### 🔐 Default Credentials (Seed Data)

| Role | Email | Password |
|------|-------|----------|
| **Super Admin** | `super.admin@gmail.com` | `password123` |
| **System Admin** | `admin@gmail.com` | `password123` |
| **HR Manager** | `hr@gmail.com` | `password123` |
| **Employee** | `employee@gmail.com` | `password123` |

---

## 🧪 Deployment

- **Backend**: Ready for Dockerization / PM2 (Process Manager).
- **Frontend**: Build using `npm run build` for production-ready static assets.

---

## 🤝 Contribution Guidelines

1.  Create a feature branch (`git checkout -b feature/amazing-feature`).
2.  Commit your changes following Conventional Commits.
3.  Open a Pull Request targeting the `develop` branch.

---

© 2024 HRIS Pro. All Rights Reserved.
