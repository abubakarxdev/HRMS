/*
  Warnings:

  - You are about to drop the column `breakType` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `customBreakEnd` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `customBreakStart` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `timezone` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "breakType",
DROP COLUMN "customBreakEnd",
DROP COLUMN "customBreakStart",
DROP COLUMN "timezone";

-- CreateTable
CREATE TABLE "EmployeeSettings" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Karachi',
    "breakType" TEXT DEFAULT 'DEFAULT',
    "customBreakStart" TIMESTAMP(3),
    "customBreakEnd" TIMESTAMP(3),

    CONSTRAINT "EmployeeSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeSettings_userId_key" ON "EmployeeSettings"("userId");

-- AddForeignKey
ALTER TABLE "EmployeeSettings" ADD CONSTRAINT "EmployeeSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
