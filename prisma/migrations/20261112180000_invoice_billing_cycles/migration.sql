-- Billing cycles: each invoice now covers a period that starts on the
-- student's enrollment day and lasts one month. Due date = periodEnd + 5 days.

ALTER TABLE "Invoice" ADD COLUMN "periodStart" TIMESTAMP(3);
ALTER TABLE "Invoice" ADD COLUMN "periodEnd" TIMESTAMP(3);

-- Backfill existing rows (no-op on a blank database): old invoices covered a
-- calendar month, so their period is [month, month + 1 month).
UPDATE "Invoice"
SET "periodStart" = "month",
    "periodEnd" = "month" + INTERVAL '1 month'
WHERE "periodStart" IS NULL;

ALTER TABLE "Invoice" ALTER COLUMN "periodStart" SET NOT NULL;
ALTER TABLE "Invoice" ALTER COLUMN "periodEnd" SET NOT NULL;

CREATE INDEX "Invoice_periodStart_idx" ON "Invoice"("periodStart");
