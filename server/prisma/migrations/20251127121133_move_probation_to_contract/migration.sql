/*
  Warnings:

  - You are about to drop the column `probationEndDate` on the `employees` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "employees" DROP COLUMN "probationEndDate";

-- AlterTable
ALTER TABLE "employment_contracts" ADD COLUMN     "probationEndDate" DATE;
