import { useState, useEffect } from "react";
import { X, Calendar, BarChart2, Edit2, Trash2 } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
} from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "../../../config/env";

// Constants
const INSTITUTE_ID = "550e8400-e29b-41d4-a716-446655440000";
const SESSION_ID = "7b8788cf-047f-4a6b-a359-4680a73b264d";

const STUDENT_ID = localStorage.getItem("student_id");

const AttendanceModal = ({ person, isOpen, onClose, type }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("month");
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && person) {
      fetchAttendanceData();
    }
  }, [isOpen, person, currentDate, viewMode]);

  const fetchAttendanceData = async () => {
    setLoading(true);

    // get institute_id from students table based on student_id
    const { data: studentData, error: studentError } = await supabase
      .from("students")
      .select("institute_id")
      .eq("id", STUDENT_ID);

    // based on the institute_id, get the session_id from sessions table
    const { data: sessionData, error: sessionError } = await supabase
      .from("sessions")
      .select("id")
      .eq("institute_id", studentData[0].institute_id);

    supabase
      .from("student_attendances")
      .select("*")
      .eq("student_id", person.id)
      .eq("institute_id", studentData[0].institute_id)
      .eq("session_id", sessionData[0].id)
      .gte("attendance_date", format(startOfMonth(currentDate), "yyyy-MM-dd"))
      .lte("attendance_date", format(endOfMonth(currentDate), "yyyy-MM-dd"))
      .then(({ data, error }) => {
        if (error) throw error;
        setAttendanceData(data || []);
      })
      .catch((error) => {
        console.error("Error fetching attendance data:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const getAttendanceStatus = (date) => {
    const record = attendanceData.find((record) =>
      isSameDay(new Date(record.attendance_date), date)
    );
    return record?.status || null;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-800";
      case "absent":
        return "bg-red-100 text-red-800";
      case "leave":
        return "bg-yellow-100 text-yellow-800";
      case "half_day":
        return "bg-blue-100 text-blue-800";
      case "wfh":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLetter = (status) => {
    switch (status) {
      case "present":
        return "P";
      case "absent":
        return "A";
      case "leave":
        return "L";
      case "half_day":
        return "HD";
      case "wfh":
        return "WFH";
      default:
        return "";
    }
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const days = eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd,
    });

    return (
      <div className="grid grid-cols-7">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-center py-2 text-sm font-medium text-gray-500"
          >
            {day}
          </div>
        ))}
        {days.map((day) => {
          const status = getAttendanceStatus(day);
          return (
            <div
              key={day.toString()}
              className={`relative border border-gray-100 p-2 py-10 text-center ${
                !isSameMonth(day, currentDate) ? "text-gray-400" : ""
              } ${isToday(day) ? "bg-blue-50" : ""} ${
                status
                  ? getStatusColor(status)
                      .replace("text-", "bg-")
                      .replace("800", "50")
                  : ""
              }`}
            >
              <span className="text-sm">{format(day, "d")}</span>
              {status && (
                <div className="absolute top-1 right-1">
                  <span
                    className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-medium ${getStatusColor(
                      status
                    )}`}
                  >
                    {getStatusLetter(status)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return (
      <div className="grid grid-cols-7">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-center py-2 text-sm font-medium text-gray-500"
          >
            {day}
          </div>
        ))}
        {days.map((day) => {
          const status = getAttendanceStatus(day);
          return (
            <div
              key={day.toString()}
              className={`relative border border-gray-100 p-2 py-10 text-center ${
                !isSameMonth(day, currentDate) ? "text-gray-400" : ""
              } ${isToday(day) ? "bg-blue-50" : ""} ${
                status
                  ? getStatusColor(status)
                      .replace("text-", "bg-")
                      .replace("800", "50")
                  : ""
              }`}
            >
              <span className="text-sm">{format(day, "d")}</span>
              {status && (
                <div className="absolute top-1 right-1">
                  <span
                    className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-medium ${getStatusColor(
                      status
                    )}`}
                  >
                    {getStatusLetter(status)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderYearView = () => {
    const yearStart = startOfYear(currentDate);
    const yearEnd = endOfYear(currentDate);
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

    // Prepare data for the chart
    const chartData = months.map((month) => {
      const monthAttendance = attendanceData.filter(
        (record) =>
          new Date(record.attendance_date).getMonth() === month.getMonth() &&
          new Date(record.attendance_date).getFullYear() === month.getFullYear()
      );

      const present = monthAttendance.filter(
        (a) => a.status === "present"
      ).length;
      const absent = monthAttendance.filter(
        (a) => a.status === "absent"
      ).length;
      const leave = monthAttendance.filter((a) => a.status === "leave").length;
      const halfDay = monthAttendance.filter(
        (a) => a.status === "half_day"
      ).length;
      const wfh = monthAttendance.filter((a) => a.status === "wfh").length;

      return {
        month: format(month, "MMM"),
        present,
        absent,
        leave,
        halfDay,
        wfh,
      };
    });

    return (
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="present" stackId="a" fill="#10B981" name="Present" />
            <Bar dataKey="absent" stackId="a" fill="#EF4444" name="Absent" />
            <Bar dataKey="leave" stackId="a" fill="#F59E0B" name="Leave" />
            <Bar dataKey="halfDay" stackId="a" fill="#3B82F6" name="Half Day" />
            {type === "staff" && (
              <Bar dataKey="wfh" stackId="a" fill="#8B5CF6" name="WFH" />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="">
      <div className="bg-white px-4 py-3 sm:px-6">
        {/* View Mode Tabs */}
        <div className=" border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setViewMode("month")}
              className={`${
                viewMode === "month"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <Calendar className="h-5 w-5 mr-2" />
              Month View
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`${
                viewMode === "week"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <Calendar className="h-5 w-5 mr-2" />
              Week View
            </button>
            <button
              onClick={() => setViewMode("year")}
              className={`${
                viewMode === "year"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <BarChart2 className="h-5 w-5 mr-2" />
              Year View
            </button>
          </nav>
        </div>

        {/* Calendar View */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => {
                if (viewMode === "month") {
                  setCurrentDate(
                    new Date(currentDate.setMonth(currentDate.getMonth() - 1))
                  );
                } else if (viewMode === "week") {
                  setCurrentDate(subWeeks(currentDate, 1));
                } else {
                  setCurrentDate(
                    new Date(
                      currentDate.setFullYear(currentDate.getFullYear() - 1)
                    )
                  );
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h2 className="text-lg font-semibold">
              {viewMode === "month"
                ? format(currentDate, "MMMM yyyy")
                : viewMode === "week"
                ? `${format(startOfWeek(currentDate), "MMM d")} - ${format(
                    endOfWeek(currentDate),
                    "MMM d, yyyy"
                  )}`
                : format(currentDate, "yyyy")}
            </h2>
            <button
              onClick={() => {
                if (viewMode === "month") {
                  setCurrentDate(
                    new Date(currentDate.setMonth(currentDate.getMonth() + 1))
                  );
                } else if (viewMode === "week") {
                  setCurrentDate(addWeeks(currentDate, 1));
                } else {
                  setCurrentDate(
                    new Date(
                      currentDate.setFullYear(currentDate.getFullYear() + 1)
                    )
                  );
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
          {viewMode === "month" && renderCalendar()}
          {viewMode === "week" && renderWeekView()}
          {viewMode === "year" && renderYearView()}
        </div>
      </div>
    </div>
  );
};

export default AttendanceModal;
