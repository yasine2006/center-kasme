-- Business rule clarification (no data change):
-- Invoice.dueDate is a historical stored value. The effective due date is the
-- monthly anniversary of the enrollment anchor and is recomputed on read
-- (src/lib/late-days.ts). The old "periodEnd + 5 days" rule no longer applies.

CREATE INDEX IF NOT EXISTS "Payment_invoiceId_paidAt_idx" ON "Payment"("invoiceId", "paidAt");
CREATE INDEX IF NOT EXISTS "AuditLog_schoolId_action_entity_entityId_createdAt_idx" ON "AuditLog"("schoolId", "action", "entity", "entityId", "createdAt");
