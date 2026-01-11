-- 1️⃣ Add new columns (safe)
ALTER TABLE "leave_policies"
ADD COLUMN "effectiveFrom_new" DATE,
ADD COLUMN "effectiveTo" DATE,
ADD COLUMN "createdByRole" "ApproverRole" NOT NULL DEFAULT 'ADMIN';

-- 2️⃣ Backfill effectiveFrom
-- If old effectiveFrom was INT (year)
UPDATE "leave_policies"
SET "effectiveFrom_new" = make_date("effectiveFrom", 1, 1)
WHERE "effectiveFrom" IS NOT NULL;

-- 3️⃣ Handle rows where effectiveFrom was NULL
UPDATE "leave_policies"
SET "effectiveFrom_new" = DATE '2025-01-01'
WHERE "effectiveFrom_new" IS NULL;

-- 4️⃣ Drop old column
ALTER TABLE "leave_policies"
DROP COLUMN "effectiveFrom";

-- 5️⃣ Rename new column
ALTER TABLE "leave_policies"
RENAME COLUMN "effectiveFrom_new" TO "effectiveFrom";

-- 6️⃣ Enforce NOT NULL
ALTER TABLE "leave_policies"
ALTER COLUMN "effectiveFrom" SET NOT NULL;

-- 7️⃣ Recreate unique index
CREATE UNIQUE INDEX "leave_policies_officeId_contractType_leaveTypeId_effectiveF_key"
ON "leave_policies" ("officeId", "contractType", "leaveTypeId", "effectiveFrom");
