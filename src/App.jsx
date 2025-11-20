import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "./config/env";
import {
  UserContext,
  SidenavContext,
  InstituteContext,
  SessionContext,
} from "./context/contexts";
import { useNotifications } from "./context/notificationContext";
import { Sidenav } from "./components/sidenav";
import { Sheet, SheetContent, SheetTrigger } from "./components/ui/sheet";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { LucideBell, LucideMenu, LucideMessageCircle } from "lucide-react";
import { Toaster } from "react-hot-toast";
import { useChatPreferences } from "./context/chatPreferencesContext";
import ChatPopup from "./pages/chat/chatPopup";

function App() {
  const { login, setStudent, studentData } = useContext(UserContext);
  const { setInstitute, instituteState } = useContext(InstituteContext);
  const { setSession } = useContext(SessionContext);
  const { setUser: setNotificationUser, unreadCount } = useNotifications();
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const { floatingEnabled } = useChatPreferences();

  useEffect(() => {
    const handleResize = () => {
      setIsMinimized(window.innerWidth < 1280);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    let progressInterval;
    const fetchUser = async () => {
      setLoading(true);
      setProgress(0);
      progressInterval = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + Math.random() * 10 : prev));
      }, 50);

      const { data, error } = await supabase.auth.getUser();
      if (data?.user) {
        login(data.user);
        setNotificationUser(data.user);
        localStorage.setItem("user_id", data.user.id);

        const { data: userData, error: userError } = await supabase
          .from("students")
          .select("*")
          .eq("user_id", data.user.id)
          .single();

        if (userError) {
          console.error("Error fetching user data:", userError);
          setLoading(false);
          clearInterval(progressInterval);
          return;
        }

        setStudent(userData);

        try {
          if (userData?.institute_id) {
            const { data: instituteData, error: instError } = await supabase
              .from("institutes")
              .select("*")
              .eq("id", userData.institute_id)
              .single();

            if (!instError && instituteData) {
              setInstitute(instituteData);
            }
          }

          if (userData?.session_id) {
            const { data: sessionData, error: sessionError } = await supabase
              .from("sessions")
              .select("*")
              .eq("id", userData.session_id)
              .single();

            if (!sessionError && sessionData) {
              setSession(sessionData);
            }
          }
        } catch (fetchError) {
          console.error("Error loading related context:", fetchError);
        }

        setProgress(100);
        setTimeout(() => setLoading(false), 120);
        clearInterval(progressInterval);
      } else {
        setLoading(false);
        clearInterval(progressInterval);
        console.error("Error fetching user:", error);
        navigate("/login");
      }
    };

    fetchUser();
    return () => clearInterval(progressInterval);
  }, [login, navigate, setInstitute, setNotificationUser, setSession, setStudent]);

  const quickStats = useMemo(() => {
    const attendanceValue =
      studentData?.attendance_percentage ??
      studentData?.attendance_rate ??
      null;
    const pendingFees = studentData?.pending_fees_amount;
    return [
      {
        label: "Enrolled Grade",
        value:
          studentData?.grade_name ||
          studentData?.grade ||
          "Awaiting placement",
        subtext: studentData?.session_name || "Current academic session",
      },
      {
        label: "Attendance",
        value: attendanceValue ? `${attendanceValue}%` : "Tracking in progress",
        subtext: attendanceValue ? "This month" : "Keep checking in daily",
      },
      {
        label: "Notifications",
        value: unreadCount > 0 ? `${unreadCount} unread` : "All caught up",
        subtext: "Institute updates",
      },
      {
        label: "Fees status",
        value:
          pendingFees && pendingFees > 0
            ? `Rs ${Number(pendingFees).toLocaleString()} due`
            : studentData?.fee_status || "Up to date",
        subtext:
          pendingFees && pendingFees > 0
            ? "Tap fees to pay online"
            : "Thank you for staying current",
      },
    ];
  }, [studentData, unreadCount]);

  return (
    <SidenavContext.Provider value={{ isMinimized, setIsMinimized }}>
      <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
        <div className="flex h-screen min-h-screen bg-muted/40 overflow-hidden">
          <aside className="hidden lg:block">
            <div className="sticky top-0 h-screen">
              <Sidenav />
            </div>
          </aside>

          <SheetContent
            side="left"
            className="w-[85%] border-r p-0 sm:max-w-sm lg:hidden"
          >
            <Sidenav isMobile onNavigate={() => setIsMobileNavOpen(false)} />
          </SheetContent>

          <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
            <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-white/80 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/60 lg:px-8">
              <div className="flex items-center gap-3">
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    aria-label="Toggle sidebar"
                  >
                    <LucideMenu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {instituteState?.name || "MEducation Institute"}
                  </p>
                  <h1 className="text-lg font-semibold text-foreground">
                    Welcome back{" "}
                    {studentData?.first_name
                      ? studentData.first_name
                      : "student"}
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  className="relative"
                  onClick={() => navigate("/notifications")}
                >
                  <LucideBell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -right-1 -top-1 h-5 w-5 justify-center rounded-full p-0 text-[11px]">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => navigate("/chat")}
                >
                  <LucideMessageCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Open chat</span>
                </Button>
              </div>
            </header>

            <main className="flex-1 min-h-0 overflow-y-auto px-4 py-6 lg:px-10">
              {loading ? (
                <div className="flex h-[70vh] flex-col items-center justify-center gap-5">
                  <h1 className="text-3xl font-black tracking-wide text-primary">
                    MEducation
                  </h1>
                  <div className="h-2 w-48 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full w-full origin-left rounded-full bg-primary transition-all duration-200"
                      style={{ transform: `scaleX(${progress / 100})` }}
                    ></div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Loading your personalized student dashboard...
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {quickStats.map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-2xl border bg-white/80 p-4 shadow-sm"
                      >
                        <p className="text-xs uppercase text-muted-foreground">
                          {stat.label}
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-foreground">
                          {stat.value}
                        </p>
                        {stat.subtext && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {stat.subtext}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  <Outlet />
                </div>
              )}
            </main>
          </div>
        </div>
        {floatingEnabled && location.pathname !== "/chat" && <ChatPopup />}
        <Toaster position="top-right" />
      </Sheet>
    </SidenavContext.Provider>
  );
}

export default App;
