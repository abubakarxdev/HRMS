/*
  Warnings:

  - The primary key for the `ApprovalRequest` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `AttendanceRecord` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `AttendanceSession` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `AuditLog` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `EmployeeSettings` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `LeaveRequest` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `LeaveType` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "ApprovalRequest" DROP CONSTRAINT "ApprovalRequest_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "AttendanceRecord" DROP CONSTRAINT "AttendanceRecord_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "AttendanceSession" DROP CONSTRAINT "AttendanceSession_attendanceRecordId_fkey";

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_actorId_fkey";

-- DropForeignKey
ALTER TABLE "EmployeeSettings" DROP CONSTRAINT "EmployeeSettings_userId_fkey";

-- DropForeignKey
ALTER TABLE "LeaveRequest" DROP CONSTRAINT "LeaveRequest_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "LeaveRequest" DROP CONSTRAINT "LeaveRequest_typeId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_managerId_fkey";

-- AlterTable
ALTER TABLE "ApprovalRequest" DROP CONSTRAINT "ApprovalRequest_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "employeeId" SET DATA TYPE TEXT,
ADD CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "ApprovalRequest_id_seq";

-- AlterTable
ALTER TABLE "AttendanceRecord" DROP CONSTRAINT "AttendanceRecord_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "employeeId" SET DATA TYPE TEXT,
ADD CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "AttendanceRecord_id_seq";

-- AlterTable
ALTER TABLE "AttendanceSession" DROP CONSTRAINT "AttendanceSession_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "attendanceRecordId" SET DATA TYPE TEXT,
ADD CONSTRAINT "AttendanceSession_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "AttendanceSession_id_seq";

-- AlterTable
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "actorId" SET DATA TYPE TEXT,
ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "AuditLog_id_seq";

-- AlterTable
ALTER TABLE "EmployeeSettings" DROP CONSTRAINT "EmployeeSettings_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ADD CONSTRAINT "EmployeeSettings_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "EmployeeSettings_id_seq";

-- AlterTable
ALTER TABLE "LeaveRequest" DROP CONSTRAINT "LeaveRequest_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "employeeId" SET DATA TYPE TEXT,
ALTER COLUMN "typeId" SET DATA TYPE TEXT,
ALTER COLUMN "reviewedBy" SET DATA TYPE TEXT,
ADD CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "LeaveRequest_id_seq";

-- AlterTable
ALTER TABLE "LeaveType" DROP CONSTRAINT "LeaveType_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "LeaveType_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "LeaveType_id_seq";

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "managerId" SET DATA TYPE TEXT,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "User_id_seq";

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSettings" ADD CONSTRAINT "EmployeeSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_attendanceRecordId_fkey" FOREIGN KEY ("attendanceRecordId") REFERENCES "AttendanceRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "LeaveType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
