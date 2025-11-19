import { useContext, useMemo } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LucideBell,
  LucideBookOpen,
  LucideCalendar,
  LucideChevronLeft,
  LucideChevronRight,
  LucideDoorOpen,
  LucideGraduationCap,
  LucideMessageCircle,
  LucideShieldCheck,
  LucideUserCircle,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { cn } from "../../lib/utils/cn";
import { supabase } from "../../config/env";
import {
  InstituteContext,
  SidenavContext,
  UserContext,
} from "../../context/contexts";
import { useNotifications } from "../../context/notificationContext";

export function Sidenav({ onNavigate, isMobile = false }) {
  const { isMinimized, setIsMinimized } = useContext(SidenavContext);
  const { instituteState } = useContext(InstituteContext);
  const { studentData, logout } = useContext(UserContext);
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const initials = useMemo(() => {
    if (!studentData?.first_name) return "ST";
    const first = studentData.first_name?.[0] || "";
    const last = studentData.last_name?.[0] || "";
    return `${first}${last}`.toUpperCase() || "ST";
  }, [studentData]);

  const showText = !isMinimized || isMobile;

  const navItems = useMemo(() => {
    const items = [
      {
        title: "Profile",
        description: "Personal details",
        to: "/",
        icon: LucideUserCircle,
      },
    ];

    if (!studentData?.institute_id) {
      items.push({
        title: "Admission",
        description: "Complete enrollment",
        to: "/admission",
        icon: LucideShieldCheck,
      });
    }

    items.push({
      title: "Studies",
      description: "Subjects & grades",
      to: "/studies",
      icon: LucideGraduationCap,
    });

    items.push({
      title: "Fees",
      description: "Invoices & payments",
      to: "/finance/fees",
      icon: LucideBookOpen,
    });

    items.push({
      title: "Attendance",
      description: "Calendar & stats",
      to: "/attendance",
      icon: LucideCalendar,
    });

    items.push({
      title: "Notifications",
      description: "Institute updates",
      to: "/notifications",
      icon: LucideBell,
      badge: unreadCount,
    });

    items.push({
      title: "Chat",
      description: "Talk with institute",
      to: "/chat",
      icon: LucideMessageCircle,
    });

    return items;
  }, [studentData, unreadCount]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      logout();
      localStorage.removeItem("entryCreated");
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const renderNavItem = (item) => {
    const Icon = item.icon;
    const content = (
      <>
        <Icon className="mr-3 h-5 w-5 shrink-0" />
        {showText && (
          <div className="flex flex-1 flex-col">
            <span>{item.title}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {item.description}
            </span>
          </div>
        )}
        {item.badge > 0 && <Badge className="ml-auto">{item.badge}</Badge>}
      </>
    );

    if (item.to) {
      return (
        <NavLink
          key={item.title}
          to={item.to}
          onClick={() => onNavigate?.()}
          className={({ isActive }) =>
            cn(
              "group relative flex items-center rounded-2xl px-3 py-3 text-sm font-medium transition-colors",
              isActive || location.pathname === item.to
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )
          }
        >
          {content}
        </NavLink>
      );
    }

    return (
      <button
        key={item.title}
        onClick={item.action}
        className="group relative flex w-full items-center rounded-2xl px-3 py-3 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        {content}
      </button>
    );
  };

  return (
    <div
      className={cn(
        "relative flex h-full flex-col border-r bg-gradient-to-b from-white/90 to-slate-50/70 p-4 backdrop-blur",
        !isMobile && "transition-all duration-300",
        !isMobile && (isMinimized ? "w-[80px]" : "w-72")
      )}
    >
      <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-white/80 px-3 py-2 shadow-sm">
        {showText && (
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              MEducation
            </p>
            <p className="text-sm font-semibold text-foreground">
              Student Portal
            </p>
          </div>
        )}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-8 w-8"
            title={isMinimized ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isMinimized ? (
              <LucideChevronRight className="h-4 w-4" />
            ) : (
              <LucideChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
      <Separator className="my-4" />
      <div className="space-y-1">{navItems.map(renderNavItem)}</div>
      <div className="mt-auto space-y-4">
        <Separator />
        <div
          className={cn(
            "rounded-2xl border border-border/40 bg-white/80 p-3 shadow-inner",
            !showText && "px-2 py-2 text-center"
          )}
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 bg-primary/10 text-primary">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            {showText && (
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {studentData
                    ? `${studentData?.first_name ?? ""} ${
                        studentData?.last_name ?? ""
                      }`
                    : "Student"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {instituteState?.name || "Institute"}
                </p>
              </div>
            )}
          </div>
          {showText && studentData?.email && (
            <p className="mt-3 text-xs text-muted-foreground">
              {studentData.email}
            </p>
          )}
          {showText && (
            <Button
              variant="outline"
              className="mt-3 w-full text-sm font-medium"
              onClick={() => navigate("/")}
            >
              Manage profile
            </Button>
          )}
        </div>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-center gap-2 text-sm font-semibold text-destructive hover:text-destructive",
            !showText && "px-2"
          )}
          onClick={handleLogout}
        >
          <LucideDoorOpen className="h-4 w-4" />
          {showText && <span>Logout</span>}
        </Button>
      </div>
    </div>
  );
}
