import { createPrisma } from "../src/lib/prisma";

const db = createPrisma();

/**
 * Verifies that the database is a blank client install:
 *   - 0 or 1 School
 *   - 0 or 1 ADMIN user
 *   - 0 TEACHER / STUDENT users
 *   - 0 student, group, enrollment, invoice, payment, attendance, notification…
 *
 * Usage: npm run db:blank-check
 */
async function main() {
  const [
    schools,
    admins,
    teachers,
    studentUsers,
    students,
    levels,
    specialties,
    groups,
    sessions,
    enrollments,
    invoices,
    invoiceLines,
    payments,
    attendance,
    registrationPeriods,
    notifications,
    teacherAttendance,
    auditLogs,
  ] = await Promise.all([
    db.school.count(),
    db.user.count({ where: { role: "ADMIN" } }),
    db.user.count({ where: { role: "TEACHER" } }),
    db.user.count({ where: { role: "STUDENT" } }),
    db.student.count(),
    db.level.count(),
    db.specialty.count(),
    db.group.count(),
    db.session.count(),
    db.enrollment.count(),
    db.invoice.count(),
    db.invoiceLine.count(),
    db.payment.count(),
    db.attendance.count(),
    db.registrationPeriod.count(),
    db.notification.count(),
    db.teacherAttendance.count(),
    db.auditLog.count(),
  ]);

  const counts: [string, number][] = [
    ["School", schools],
    ["User ADMIN", admins],
    ["User TEACHER", teachers],
    ["User STUDENT", studentUsers],
    ["Student", students],
    ["Level", levels],
    ["Specialty", specialties],
    ["Group", groups],
    ["Session", sessions],
    ["Enrollment", enrollments],
    ["Invoice", invoices],
    ["InvoiceLine", invoiceLines],
    ["Payment", payments],
    ["Attendance", attendance],
    ["RegistrationPeriod", registrationPeriods],
    ["Notification", notifications],
    ["TeacherAttendance", teacherAttendance],
    ["AuditLog", auditLogs],
  ];

  console.log("\n=== Blank database check ===");
  for (const [label, value] of counts) {
    console.log(`  ${label.padEnd(22)} ${value}`);
  }

  const problems: string[] = [];
  if (schools > 1) problems.push("more than one School");
  if (admins > 1) problems.push("more than one ADMIN");
  if (schools === 1 && admins === 0) problems.push("School exists but no ADMIN");
  if (schools === 0 && admins === 1) problems.push("ADMIN exists but no School");
  if (teachers > 0) problems.push("TEACHER accounts present");
  if (studentUsers > 0) problems.push("STUDENT accounts present");
  if (students > 0) problems.push("Student records present");
  if (levels > 0) problems.push("Level records present");
  if (specialties > 0) problems.push("Specialty records present");
  if (groups > 0) problems.push("Group records present");
  if (sessions > 0) problems.push("Session records present");
  if (enrollments > 0) problems.push("Enrollment records present");
  if (invoices > 0) problems.push("Invoice records present");
  if (invoiceLines > 0) problems.push("InvoiceLine records present");
  if (payments > 0) problems.push("Payment records present");
  if (attendance > 0) problems.push("Attendance records present");
  if (registrationPeriods > 0) problems.push("RegistrationPeriod records present");
  if (notifications > 0) problems.push("Notification records present");
  if (teacherAttendance > 0) problems.push("TeacherAttendance records present");

  if (problems.length) {
    console.log(`\n=== FAIL: ${problems.length} problem(s) ===`);
    for (const problem of problems) console.log(`  - ${problem}`);
    process.exitCode = 1;
    return;
  }

  console.log("\n=== OK: database is blank (only School + ADMIN allowed) ===");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
