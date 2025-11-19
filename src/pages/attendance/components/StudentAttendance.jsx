import AttendanceModal from "./AttendanceModal";

export default function StudentAttendance() {
  const studentId = localStorage.getItem("student_id");

  if (!studentId) {
    return (
      <div className="rounded-2xl border border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground">
        Please login again to view your attendance timeline.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white p-2 shadow-sm">
      <AttendanceModal person={{ id: studentId }} type="student" />
    </div>
  );
}
