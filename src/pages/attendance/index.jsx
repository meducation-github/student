import PageHeader from "../../components/pageHeader";
import StudentAttendance from "./components/StudentAttendance";

function Attendance() {
  return (
    <div className="">
      <PageHeader
        title={"Attendance"}
        subtitle={"Manage your attendance information"}
      />

      <div className="">
        <StudentAttendance />
      </div>
    </div>
  );
}

export default Attendance;
