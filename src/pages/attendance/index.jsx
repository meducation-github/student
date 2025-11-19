import { useContext, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { UserContext } from "../../context/contexts";
import { LucideCalendarDays, LucideClock, LucideTrendingUp } from "lucide-react";
import StudentAttendance from "./components/StudentAttendance";

function Attendance() {
  const { studentData } = useContext(UserContext);

  const summary = useMemo(
    () => [
      {
        label: "Attendance rate",
        value: studentData?.attendance_percentage
          ? `${studentData.attendance_percentage}%`
          : "Tracking",
        description: "Based on institute records",
        icon: LucideTrendingUp,
      },
      {
        label: "Last updated",
        value: studentData?.attendance_updated_at
          ? new Date(studentData.attendance_updated_at).toLocaleDateString()
          : "Today",
        description: "Auto refreshes every day",
        icon: LucideCalendarDays,
      },
      {
        label: "Status",
        value: studentData?.status || "Enrolled",
        description: "Enrollment standing",
        icon: LucideClock,
      },
    ],
    [studentData]
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white/80 p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Attendance
        </p>
        <h1 className="mt-1 text-3xl font-bold text-foreground">
          Visualize your attendance journey
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Switch between monthly, weekly, and yearly trends to stay connected with your classroom presence.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {summary.map((item) => (
          <Card key={item.label}>
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <CardDescription>{item.label}</CardDescription>
                <CardTitle>{item.value}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <StudentAttendance />
    </div>
  );
}

export default Attendance;
