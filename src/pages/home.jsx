import { useState, useEffect, useContext } from "react";
import {
  Users,
  GraduationCap,
  UserPlus,
  DollarSign,
  Calendar,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  TrendingUp,
  TrendingDown,
  Building2,
  UserCheck,
  UserX,
  Briefcase,
  Wallet,
  Receipt,
  CreditCard,
} from "lucide-react";
import { InstituteContext, SessionContext } from "../context/contexts";
import { supabase } from "../config/env";

// Utility function to format money values
const formatMoney = (amount) => {
  return `Rs. ${Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

const Home = () => {
  const { instituteState } = useContext(InstituteContext);
  const { sessionState } = useContext(SessionContext);
  const [dashboardData, setDashboardData] = useState({
    profile: {
      latestNews: [],
      latestEvents: [],
    },
    students: {
      total: 0,
      byGrade: {},
    },
    staff: {
      total: 0,
    },
    parents: {
      total: 0,
    },
    finance: {
      fees: {
        currentMonth: { collected: 0, remaining: 0 },
        session: { collected: 0, remaining: 0 },
      },
      salary: {
        currentMonth: { paid: 0, unpaid: 0 },
        session: { paid: 0, unpaid: 0 },
      },
      expenses: {
        currentMonth: 0,
        session: 0,
      },
    },
    attendance: {
      students: { present: 0, absent: 0 },
      staff: { present: 0, absent: 0 },
    },
    admissions: {
      pending: 0,
      reviewing: 0,
      approved: 0,
      rejected: 0,
      total: 0,
    },
  });

  // useEffect(() => {
  //   const fetchDashboardData = async () => {
  //     const { data: news, error } = await supabase
  //       .from("news")
  //       .select("*")
  //       .eq("institute_id", instituteState.id)
  //       .order("created_at", { ascending: false })
  //       .limit(2);

  //     // get 5 events from events table based on institute_id
  //     const { data: events, error: eventsError } = await supabase
  //       .from("events")
  //       .select("*")
  //       .eq("institute_id", instituteState.id)
  //       .order("created_at", { ascending: false })
  //       .limit(5);

  //     // get total students count from students table based on institute_id
  //     const { count: studentsCount, error: studentsError } = await supabase
  //       .from("students")
  //       .select("*", { count: "exact", head: true })
  //       .eq("institute_id", instituteState.id);

  //     // get total staff count from staff table based on institute_id
  //     const { count: staffCount, error: staffError } = await supabase
  //       .from("staff")
  //       .select("*", { count: "exact", head: true })
  //       .eq("institute_id", instituteState.id);

  //     // get total parents count from parents table based on institute_id
  //     const { count: parentsCount, error: parentsError } = await supabase
  //       .from("parents")
  //       .select("*", { count: "exact", head: true })
  //       .eq("institute_id", instituteState.id);

  //     // Get current month's fees data
  //     const currentDate = new Date();
  //     const firstDayOfMonth = new Date(
  //       currentDate.getFullYear(),
  //       currentDate.getMonth(),
  //       1
  //     );
  //     const lastDayOfMonth = new Date(
  //       currentDate.getFullYear(),
  //       currentDate.getMonth() + 1,
  //       0
  //     );

  //     // Format dates to YYYY-MM-DD for proper comparison
  //     const formatDate = (date) => {
  //       return date.toISOString().split("T")[0];
  //     };

  //     const { data: currentMonthFees, error: currentMonthFeesError } =
  //       await supabase
  //         .from("fees")
  //         .select("total_fee, paid_fee, cycle_start_date, cycle_end_date")
  //         .eq("institute_id", instituteState.id)
  //         .eq("session_id", sessionState.id)
  //         .gte("cycle_start_date", formatDate(firstDayOfMonth))
  //         .lte("cycle_start_date", formatDate(lastDayOfMonth));

  //     console.log("Current Month Fees:", {
  //       dateRange: {
  //         start: formatDate(firstDayOfMonth),
  //         end: formatDate(lastDayOfMonth),
  //       },
  //       fees: currentMonthFees,
  //     });

  //     // Get all fees data for current session
  //     const { data: sessionFees, error: sessionFeesError } = await supabase
  //       .from("fees")
  //       .select("total_fee, paid_fee")
  //       .eq("institute_id", instituteState.id)
  //       .eq("session_id", sessionState.id);

  //     // Get current month's salary data
  //     const currentMonth = currentDate.toLocaleString("default", {
  //       month: "long",
  //     });
  //     const currentYear = currentDate.getFullYear();

  //     const { data: currentMonthSalaries, error: currentMonthSalariesError } =
  //       await supabase
  //         .from("salaries")
  //         .select("amount, status")
  //         .eq("institute_id", instituteState.id)
  //         .eq("session_id", sessionState.id)
  //         .eq("month", currentMonth)
  //         .eq("year", currentYear);

  //     // Get all salary data for current session
  //     const { data: sessionSalaries, error: sessionSalariesError } =
  //       await supabase
  //         .from("salaries")
  //         .select("amount, status")
  //         .eq("institute_id", instituteState.id)
  //         .eq("session_id", sessionState.id);

  //     // Get current month's expenses
  //     const { data: currentMonthExpenses, error: currentMonthExpensesError } =
  //       await supabase
  //         .from("expenses")
  //         .select("amount")
  //         .eq("institute_id", instituteState.id)
  //         .eq("session_id", sessionState.id)
  //         .gte("expense_date", formatDate(firstDayOfMonth))
  //         .lte("expense_date", formatDate(lastDayOfMonth));

  //     // Get all expenses for current session
  //     const { data: sessionExpenses, error: sessionExpensesError } =
  //       await supabase
  //         .from("expenses")
  //         .select("amount")
  //         .eq("institute_id", instituteState.id)
  //         .eq("session_id", sessionState.id);

  //     // Get today's student attendance
  //     const today = new Date();
  //     const formattedToday = formatDate(today);

  //     const {
  //       data: todayStudentAttendance,
  //       error: todayStudentAttendanceError,
  //     } = await supabase
  //       .from("student_attendances")
  //       .select("status")
  //       .eq("institute_id", instituteState.id)
  //       .eq("session_id", sessionState.id)
  //       .eq("attendance_date", formattedToday);

  //     // Get today's staff attendance
  //     const { data: todayStaffAttendance, error: todayStaffAttendanceError } =
  //       await supabase
  //         .from("staff_attendances")
  //         .select("status")
  //         .eq("institute_id", instituteState.id)
  //         .eq("session_id", sessionState.id)
  //         .eq("attendance_date", formattedToday);

  //     // Get admissions data for current session
  //     const { data: admissionsData, error: admissionsError } = await supabase
  //       .from("admissions")
  //       .select("status")
  //       .eq("institute_id", instituteState.id)
  //       .eq("session_id", sessionState.id);

  //     // Calculate admissions totals by status
  //     const admissionsByStatus = {
  //       pending:
  //         admissionsData?.filter((admission) => admission.status === "pending")
  //           .length || 0,
  //       reviewing:
  //         admissionsData?.filter(
  //           (admission) => admission.status === "reviewing"
  //         ).length || 0,
  //       approved:
  //         admissionsData?.filter((admission) => admission.status === "approved")
  //           .length || 0,
  //       rejected:
  //         admissionsData?.filter((admission) => admission.status === "rejected")
  //           .length || 0,
  //     };

  //     console.log("Admissions Calculations:", {
  //       byStatus: admissionsByStatus,
  //       total: admissionsData?.length || 0,
  //     });

  //     // Calculate attendance totals
  //     const studentPresent =
  //       todayStudentAttendance?.filter(
  //         (attendance) => attendance.status === "present"
  //       ).length || 0;
  //     const studentAbsent =
  //       todayStudentAttendance?.filter(
  //         (attendance) => attendance.status === "absent"
  //       ).length || 0;
  //     const staffPresent =
  //       todayStaffAttendance?.filter(
  //         (attendance) => attendance.status === "present"
  //       ).length || 0;
  //     const staffAbsent =
  //       todayStaffAttendance?.filter(
  //         (attendance) => attendance.status === "absent"
  //       ).length || 0;

  //     console.log("Attendance Calculations:", {
  //       students: {
  //         present: studentPresent,
  //         absent: studentAbsent,
  //         total: todayStudentAttendance?.length || 0,
  //       },
  //       staff: {
  //         present: staffPresent,
  //         absent: staffAbsent,
  //         total: todayStaffAttendance?.length || 0,
  //       },
  //     });

  //     // Calculate fees totals and remaining amounts
  //     const currentMonthTotal =
  //       currentMonthFees?.reduce(
  //         (sum, fee) => sum + Number(fee.total_fee || 0),
  //         0
  //       ) || 0;
  //     const currentMonthPaid =
  //       currentMonthFees?.reduce(
  //         (sum, fee) => sum + Number(fee.paid_fee || 0),
  //         0
  //       ) || 0;
  //     const sessionTotal =
  //       sessionFees?.reduce(
  //         (sum, fee) => sum + Number(fee.total_fee || 0),
  //         0
  //       ) || 0;
  //     const sessionPaid =
  //       sessionFees?.reduce((sum, fee) => sum + Number(fee.paid_fee || 0), 0) ||
  //       0;

  //     // Calculate salary totals and remaining amounts
  //     const currentMonthSalaryTotal =
  //       currentMonthSalaries?.reduce(
  //         (sum, salary) => sum + Number(salary.amount || 0),
  //         0
  //       ) || 0;
  //     const currentMonthSalaryPaid =
  //       currentMonthSalaries
  //         ?.filter((salary) => salary.status === "paid")
  //         .reduce((sum, salary) => sum + Number(salary.amount || 0), 0) || 0;
  //     const sessionSalaryTotal =
  //       sessionSalaries?.reduce(
  //         (sum, salary) => sum + Number(salary.amount || 0),
  //         0
  //       ) || 0;
  //     const sessionSalaryPaid =
  //       sessionSalaries
  //         ?.filter((salary) => salary.status === "paid")
  //         .reduce((sum, salary) => sum + Number(salary.amount || 0), 0) || 0;

  //     // Calculate expenses totals
  //     const currentMonthExpensesTotal =
  //       currentMonthExpenses?.reduce(
  //         (sum, expense) => sum + Number(expense.amount || 0),
  //         0
  //       ) || 0;
  //     const sessionExpensesTotal =
  //       sessionExpenses?.reduce(
  //         (sum, expense) => sum + Number(expense.amount || 0),
  //         0
  //       ) || 0;

  //     console.log("Salary Calculations:", {
  //       currentMonth: {
  //         total: currentMonthSalaryTotal,
  //         paid: currentMonthSalaryPaid,
  //         remaining: currentMonthSalaryTotal - currentMonthSalaryPaid,
  //       },
  //       session: {
  //         total: sessionSalaryTotal,
  //         paid: sessionSalaryPaid,
  //         remaining: sessionSalaryTotal - sessionSalaryPaid,
  //       },
  //     });

  //     console.log("Expenses Calculations:", {
  //       currentMonth: {
  //         total: currentMonthExpensesTotal,
  //       },
  //       session: {
  //         total: sessionExpensesTotal,
  //       },
  //     });

  //     setDashboardData((prev) => ({
  //       ...prev,
  //       profile: {
  //         latestNews: news,
  //         latestEvents: events,
  //       },
  //       students: {
  //         total: studentsCount || 0,
  //       },
  //       staff: {
  //         total: staffCount || 0,
  //       },
  //       parents: {
  //         total: parentsCount || 0,
  //       },
  //       admissions: {
  //         pending: admissionsByStatus.pending,
  //         reviewing: admissionsByStatus.reviewing,
  //         approved: admissionsByStatus.approved,
  //         rejected: admissionsByStatus.rejected,
  //         total: admissionsData?.length || 0,
  //       },
  //       finance: {
  //         ...prev.finance,
  //         fees: {
  //           currentMonth: {
  //             collected: currentMonthPaid,
  //             remaining: currentMonthTotal - currentMonthPaid,
  //           },
  //           session: {
  //             collected: sessionPaid,
  //             remaining: sessionTotal - sessionPaid,
  //           },
  //         },
  //         salary: {
  //           currentMonth: {
  //             paid: currentMonthSalaryPaid,
  //             unpaid: currentMonthSalaryTotal - currentMonthSalaryPaid,
  //           },
  //           session: {
  //             paid: sessionSalaryPaid,
  //             unpaid: sessionSalaryTotal - sessionSalaryPaid,
  //           },
  //         },
  //         expenses: {
  //           currentMonth: currentMonthExpensesTotal,
  //           session: sessionExpensesTotal,
  //         },
  //       },
  //       attendance: {
  //         students: {
  //           present: studentPresent,
  //           absent: studentAbsent,
  //         },
  //         staff: {
  //           present: staffPresent,
  //           absent: staffAbsent,
  //         },
  //       },
  //     }));
  //   };

  //   fetchDashboardData();
  // }, []);

  return (
    <div className="container mx-auto p-4 dark:text-white">
      <h1 className="text-2xl inline-block font-semibold ">
        Welcome to{" "}
        <span className="text-blue-500 font-bold">{instituteState.name}</span>
      </h1>
      <p className="text-gray-500 inline-block ml-2 text-sm">
        Everything looks good, there is nothing that needs immediate attention.
      </p>

      {/* Profile Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 mt-3 gap-3 mb-3">
        <div className="bg-white dark:bg-gray-800  rounded-lg border border-gray-200 p-4 overflow-hidden">
          <h2 className="text-lg font-semibold mb-4  flex items-center">
            <FileText className="mr-2 w-4" /> Latest News
          </h2>
          <div className="relative overflow-hidden ">
            <div className="animate-scroll-news flex space-x-4">
              {dashboardData.profile.latestNews?.map((news, index) => (
                <div
                  key={index}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 flex-shrink-0 w-[calc(50%-0.5rem)]"
                >
                  <h3 className="text-sm">{news.title}</h3>
                  {/* <p className="text-sm text-gray-600 dark:text-gray-400">
                    {news.description}
                  </p> */}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 p-4 overflow-hidden">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Calendar className="mr-2 w-4" /> Latest Events
          </h2>
          <div className="relative overflow-hidden">
            <div className="animate-scroll-events flex space-x-4">
              {dashboardData.profile.latestEvents?.map((event, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-lg p-2 flex-shrink-0 w-[calc(50%-0.5rem)]"
                >
                  <h3 className="text-sm inline-block">{event.name}</h3>
                  <p className="text-xs inline-block ml-2 text-gray-600 ">
                    {event.date}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scrollNews {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @keyframes scrollEvents {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-scroll-news {
          animation: scrollNews 20s linear infinite;
        }

        .animate-scroll-events {
          animation: scrollEvents 20s linear infinite;
        }

        .animate-scroll-news:hover,
        .animate-scroll-events:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Students
              </p>
              <h3 className="text-3xl font-bold">
                {dashboardData.students.total}
              </h3>
            </div>
            <GraduationCap className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Staff
              </p>
              <h3 className="text-3xl font-bold">
                {dashboardData.staff.total}
              </h3>
            </div>
            <Users className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Parents
              </p>
              <h3 className="text-3xl font-bold">
                {dashboardData.parents.total}
              </h3>
            </div>
            <UserPlus className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Admissions
              </p>
              <h3 className="text-3xl font-bold">
                {dashboardData.admissions.total}
              </h3>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Finance Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 p-4">
          <h2 className="mb-4 flex items-center text-lg font-semibold">
            <DollarSign className="mr-2 w-5 h-5 text-blue-500" /> Fees Overview
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-1" /> This Month
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <div className="flex items-center mb-1">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Collected
                    </span>
                  </div>
                  <p className="text-sm font-medium">
                    {formatMoney(
                      dashboardData.finance.fees.currentMonth.collected
                    )}
                  </p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                  <div className="flex items-center mb-1">
                    <AlertCircle className="w-4 h-4 text-orange-500 mr-1" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Remaining
                    </span>
                  </div>
                  <p className="text-sm font-medium">
                    {formatMoney(
                      dashboardData.finance.fees.currentMonth.remaining
                    )}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-1" /> Session Total
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <div className="flex items-center mb-1">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Collected
                    </span>
                  </div>
                  <p className="text-sm font-medium">
                    {formatMoney(dashboardData.finance.fees.session.collected)}
                  </p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                  <div className="flex items-center mb-1">
                    <AlertCircle className="w-4 h-4 text-orange-500 mr-1" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Remaining
                    </span>
                  </div>
                  <p className="text-sm font-medium">
                    {formatMoney(dashboardData.finance.fees.session.remaining)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 p-4">
          <h2 className="mb-4 flex items-center text-lg font-semibold">
            <Wallet className="mr-2 w-5 h-5 text-purple-500" /> Salary Overview
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-1" /> This Month
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <div className="flex items-center mb-1">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Paid
                    </span>
                  </div>
                  <p className="text-sm font-medium">
                    {formatMoney(
                      dashboardData.finance.salary.currentMonth.paid
                    )}
                  </p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                  <div className="flex items-center mb-1">
                    <AlertCircle className="w-4 h-4 text-orange-500 mr-1" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Unpaid
                    </span>
                  </div>
                  <p className="text-sm font-medium">
                    {formatMoney(
                      dashboardData.finance.salary.currentMonth.unpaid
                    )}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-1" /> Session Total
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <div className="flex items-center mb-1">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Paid
                    </span>
                  </div>
                  <p className="text-sm font-medium">
                    {formatMoney(dashboardData.finance.salary.session.paid)}
                  </p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                  <div className="flex items-center mb-1">
                    <AlertCircle className="w-4 h-4 text-orange-500 mr-1" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Unpaid
                    </span>
                  </div>
                  <p className="text-sm font-medium">
                    {formatMoney(dashboardData.finance.salary.session.unpaid)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 p-4">
          <h2 className="mb-4 flex items-center text-lg font-semibold">
            <Receipt className="mr-2 w-5 h-5 text-red-500" /> Expenses Overview
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-1" /> This Month
              </p>
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                <div className="flex items-center mb-1">
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Total Expenses
                  </span>
                </div>
                <p className="text-sm font-medium">
                  {formatMoney(dashboardData.finance.expenses.currentMonth)}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-1" /> Session Total
              </p>
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                <div className="flex items-center mb-1">
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Total Expenses
                  </span>
                </div>
                <p className="text-sm font-medium">
                  {formatMoney(dashboardData.finance.expenses.session)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 p-4">
          <h2 className="mb-4 flex items-center">
            <UserCheck className="mr-1 w-4" /> Student Attendance
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
              <div className="flex items-center">
                <CheckCircle2 className="w-5 text-green-500 mr-2" />
                <div>
                  <p className="text-sm">Present</p>
                  <p className="text-xl font-bold">
                    {dashboardData.attendance.students.present}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-red-100 dark:bg-red-900 p-2 rounded-lg">
              <div className="flex items-center">
                <XCircle className="w-5 text-red-500 mr-2" />
                <div>
                  <p className="text-sm">Absent</p>
                  <p className="text-xl font-bold">
                    {dashboardData.attendance.students.absent}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 p-4">
          <h2 className="mb-4 flex items-center">
            <Briefcase className="mr-1 w-4" /> Staff Attendance
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
              <div className="flex items-center">
                <CheckCircle2 className="w-5 text-green-500 mr-2" />
                <div>
                  <p className="text-sm">Present</p>
                  <p className="text-xl font-bold">
                    {dashboardData.attendance.staff.present}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-red-100 dark:bg-red-900 p-2 rounded-lg">
              <div className="flex items-center">
                <XCircle className="w-5 text-red-500 mr-2" />
                <div>
                  <p className="text-sm">Absent</p>
                  <p className="text-xl font-bold">
                    {dashboardData.attendance.staff.absent}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admissions Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 p-4">
        <h2 className="mb-4 flex items-center text-lg font-semibold">
          <FileText className="mr-2 w-5 h-5 text-blue-500" /> Admissions Status
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
            <div className="flex items-center mb-1">
              <Clock className="w-4 h-4 text-yellow-500 mr-1" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Pending
              </span>
            </div>
            <p className="text-sm font-medium">
              {dashboardData.admissions.pending}
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <div className="flex items-center mb-1">
              <FileText className="w-4 h-4 text-blue-500 mr-1" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                In Review
              </span>
            </div>
            <p className="text-sm font-medium">
              {dashboardData.admissions.reviewing}
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <div className="flex items-center mb-1">
              <CheckCircle2 className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Approved
              </span>
            </div>
            <p className="text-sm font-medium">
              {dashboardData.admissions.approved}
            </p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            <div className="flex items-center mb-1">
              <XCircle className="w-4 h-4 text-red-500 mr-1" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Rejected
              </span>
            </div>
            <p className="text-sm font-medium">
              {dashboardData.admissions.rejected}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
