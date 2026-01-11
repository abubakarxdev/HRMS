/*
  Warnings:

  - You are about to drop the column `leaveType` on the `leave_balances` table. All the data in the column will be lost.
  - You are about to drop the column `totalCredits` on the `leave_balances` table. All the data in the column will be lost.
  - You are about to drop the column `usedCredits` on the `leave_balances` table. All the data in the column will be lost.
  - You are about to drop the column `leaveType` on the `leave_requests` table. All the data in the column will be lost.
  - The `status` column on the `leave_requests` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `date` on the `public_holidays` table. All the data in the column will be lost.
  - You are about to drop the `leave_settings` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[employeeId,year,leaveTypeId]` on the table `leave_balances` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `leaveTypeId` to the `leave_balances` table without a default value. This is not possible if the table is not empty.
  - Added the required column `officeId` to the `leave_balances` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalCreditsMinutes` to the `leave_balances` table without a default value. This is not possible if the table is not empty.
  - Added the required column `leaveTypeId` to the `leave_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `officeId` to the `leave_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endDate` to the `public_holidays` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `public_holidays` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LeavePolicyType" AS ENUM ('FULL_TIME', 'PROBATION', 'INTERN', 'CONTRACTUAL');

-- CreateEnum
CREATE TYPE "LeaveDuration" AS ENUM ('FULL_DAY', 'HALF_DAY_AM', 'HALF_DAY_PM');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApproverRole" AS ENUM ('HR', 'ADMIN', 'SYSTEM');

-- DropForeignKey
ALTER TABLE "leave_settings" DROP CONSTRAINT "leave_settings_legalEntityId_fkey";

-- DropIndex
DROP INDEX "leave_balances_employeeId_year_leaveType_key";

-- DropIndex
DROP INDEX "public_holidays_officeId_date_key";

-- AlterTable
ALTER TABLE "leave_balances" DROP COLUMN "leaveType",
DROP COLUMN "totalCredits",
DROP COLUMN "usedCredits",
ADD COLUMN     "leaveTypeId" TEXT NOT NULL,
ADD COLUMN     "officeId" TEXT NOT NULL,
ADD COLUMN     "totalCreditsMinutes" INTEGER NOT NULL,
ADD COLUMN     "usedCreditsMinutes" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "leave_requests" DROP COLUMN "leaveType",
ADD COLUMN     "approvalReason" TEXT,
ADD COLUMN     "approvedByRole" "ApproverRole",
ADD COLUMN     "duration" "LeaveDuration" NOT NULL DEFAULT 'FULL_DAY',
ADD COLUMN     "leaveTypeId" TEXT NOT NULL,
ADD COLUMN     "officeId" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "public_holidays" DROP COLUMN "date",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "endDate" DATE NOT NULL,
ADD COLUMN     "isHalfDay" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isOptional" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "startDate" DATE NOT NULL;

-- DropTable
DROP TABLE "leave_settings";

-- CreateTable
CREATE TABLE "leave_types" (
    "id" TEXT NOT NULL,
    "officeId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPaid" BOOLEAN NOT NULL DEFAULT true,
    "allowHalfDay" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "leave_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_policies" (
    "id" TEXT NOT NULL,
    "officeId" TEXT NOT NULL,
    "contractType" "ContractType" NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "annualQuotaMinutes" INTEGER NOT NULL,
    "carryForwardAllowed" BOOLEAN NOT NULL DEFAULT false,
    "maxCarryForwardMinutes" INTEGER,
    "effectiveFrom" INTEGER NOT NULL,

    CONSTRAINT "leave_policies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "leave_types_officeId_code_key" ON "leave_types"("officeId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "leave_policies_officeId_contractType_leaveTypeId_effectiveF_key" ON "leave_policies"("officeId", "contractType", "leaveTypeId", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "leave_balances_employeeId_year_leaveTypeId_key" ON "leave_balances"("employeeId", "year", "leaveTypeId");

-- CreateIndex
CREATE INDEX "public_holidays_officeId_startDate_endDate_idx" ON "public_holidays"("officeId", "startDate", "endDate");

-- AddForeignKey
ALTER TABLE "leave_types" ADD CONSTRAINT "leave_types_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "offices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_policies" ADD CONSTRAINT "leave_policies_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "offices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_policies" ADD CONSTRAINT "leave_policies_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "leave_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "leave_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "leave_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
