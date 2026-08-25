-- DropForeignKey
ALTER TABLE "expenses" DROP CONSTRAINT IF EXISTS "expenses_userId_fkey";

-- DropTable
DROP TABLE IF EXISTS "expenses";

-- DropEnum
DROP TYPE IF EXISTS "ExpenseCategory";
