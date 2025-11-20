/*
  Warnings:

  - You are about to drop the column `clockIn` on the `AttendanceRecord` table. All the data in the column will be lost.
  - You are about to drop the column `clockOut` on the `AttendanceRecord` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AttendanceRecord" DROP COLUMN "clockIn",
DROP COLUMN "clockOut";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "breakType" TEXT,
ADD COLUMN     "customBreakEnd" TIMESTAMP(3),
ADD COLUMN     "customBreakStart" TIMESTAMP(3),
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'UTC';

-- CreateTable
CREATE TABLE "AttendanceSession" (
    "id" SERIAL NOT NULL,
    "attendanceRecordId" INTEGER NOT NULL,
    "checkIn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkOut" TIMESTAMP(3),
    "location" TEXT,

    CONSTRAINT "AttendanceSession_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_attendanceRecordId_fkey" FOREIGN KEY ("attendanceRecordId") REFERENCES "AttendanceRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
