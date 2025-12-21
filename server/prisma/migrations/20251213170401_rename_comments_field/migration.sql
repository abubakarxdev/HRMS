/*
  Warnings:

  - You are about to drop the column `managerComments` on the `leave_requests` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "leave_requests" DROP COLUMN "managerComments",
ADD COLUMN     "approverComments" TEXT;
