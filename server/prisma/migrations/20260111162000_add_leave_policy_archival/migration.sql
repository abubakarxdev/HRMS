-- AlterTable
ALTER TABLE "leave_policies" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "archivedByRole" "ApproverRole",
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;
