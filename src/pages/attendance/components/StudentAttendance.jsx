import AttendanceModal from "./AttendanceModal";

const STUDENT_ID = localStorage.getItem("student_id");

function StudentAttendance() {
  return (
    <div>
      <AttendanceModal
        person={{ id: STUDENT_ID }}
        isOpen={true}
        onClose={() => {
          setShowAttendanceModal(false);
          setSelectedStudent(null);
        }}
        type="student"
      />
    </div>
  );
}

export default StudentAttendance;
