import { NavLink } from "react-router-dom";
import { LuLogOut } from "react-icons/lu";
import { useContext, useState, useEffect } from "react";
import { SidenavContext } from "../../context/contexts";
import { useNotifications } from "../../context/notificationContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../config/env";
import {
  LucideGraduationCap,
  LucideUserCircle,
  LucideWallet,
  LucideCalendar,
  LucideBookOpen,
  LucideBell,
} from "lucide-react";

const STUDENT_ID = "22005ab9-d995-4a57-851f-7a7ad45a92cb";

export function Sidenav() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { isMinimized, setIsMinimized } = useContext(SidenavContext);
  const { unreadCount } = useNotifications();
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isMediumScreen, setIsMediumScreen] = useState(false);
  const [studentData, setStudentData] = useState(null);

  const navigation = useNavigate();

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const { data, error } = await supabase
          .from("students")
          .select("*")
          .eq("id", STUDENT_ID)
          .single();

        if (error) throw error;
        setStudentData(data);
      } catch (error) {
        console.error("Error fetching student data:", error);
      }
    };

    fetchStudentData();
  }, []);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768); // md breakpoint
      setIsMediumScreen(window.innerWidth >= 768 && window.innerWidth < 1024); // between md and lg
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error.message);
    } else {
      localStorage.removeItem("entryCreated");
      navigation("/login");
      console.log("User logged out successfully");
    }
  };

  const baseModules = [
    {
      name: "Profile",
      link: "./",
      icon: <LucideUserCircle className="w-4 lg:w-5" />,
    },
    {
      name: "Admission",
      link: "./admission",
      icon: <LucideBookOpen className="w-4 lg:w-5" />,
    },
  ];

  const activeModules = [
    ...baseModules,
    {
      name: "Studies",
      link: "./studies",
      icon: <LucideGraduationCap className="w-4 lg:w-5" />,
    },
    {
      name: "Fees",
      link: "./finance/fees",
      icon: <LucideWallet className="w-4 lg:w-5" />,
    },
    {
      name: "Attendance",
      link: "./attendance",
      icon: <LucideCalendar className="w-4 lg:w-5" />,
    },
    {
      name: "Notifications",
      link: "./notifications",
      icon: (
        <div className="relative">
          <LucideBell className="w-4 lg:w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
      ),
    },
  ];

  const Modules =
    studentData?.status === "Active" ? activeModules : baseModules;

  return (
    <div
      className={`rounded-md px-1 relative h-full flex flex-col overflow-hidden transition-all duration-300 ${
        isMinimized || isMediumScreen ? "w-16" : "auto"
      }`}
    >
      <div
        className="text-left ml-1 select-none items-center p-1 font-bold text-xl py-1 cursor-pointer hover:text-zinc-800 transition-colors"
        onClick={() =>
          !isSmallScreen && !isMediumScreen && setIsMinimized(!isMinimized)
        }
      >
        <h1 className="text-left mt-4 text-xl lg:text-xl font-bold text-blue-600 p-1">
          {isMinimized || isMediumScreen ? "ME" : "MEd Student"}
        </h1>
      </div>
      <nav className="mt-2 md:mt-5">
        {Modules.map((item) => (
          <div>
            <NavLink
              to={item.link}
              key={item.name}
              title={item.name}
              className={({ isActive }) =>
                `flex items-center gap-3 lg:gap-4 text-gray-600 py-1.5 lg:py-3 px-2 lg:px-3 my-0.5 lg:my-1 rounded-md hover:bg-gray-200 ${
                  isActive ? "bg-gray-200 !text-blue-600" : ""
                }`
              }
            >
              <div className="flex items-center justify-center">
                {item.icon}
              </div>
              {!isMinimized && !isMediumScreen && (
                <p className="truncate text-xs lg:text-base">{item.name}</p>
              )}
            </NavLink>
          </div>
        ))}
      </nav>
      <div className="absolute bottom-0">
        <div className="mt-0 mb-1 relative">
          <div
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 lg:gap-4 p-1.5 lg:p-2 my-0.5 lg:my-1 rounded-md hover:bg-gray-200 cursor-pointer group relative"
          >
            <div
              className="flex items-center justify-center w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-blue-100 text-blue-600 font-semibold"
              title={
                isMinimized || isMediumScreen
                  ? `${studentData?.first_name}\n${studentData?.email}`
                  : undefined
              }
            >
              {studentData?.first_name?.charAt(0)?.toUpperCase()}
            </div>
            {!isMinimized && !isMediumScreen && (
              <div className="flex flex-col">
                <span className="truncate text-xs lg:text-sm md:font-medium">
                  {studentData?.first_name} {studentData?.last_name}
                </span>
                <span className="text-[10px] lg:text-xs text-gray-500 truncate">
                  {studentData?.email}
                </span>
              </div>
            )}
          </div>

          {isDropdownOpen && (
            <div
              className={`absolute bottom-full left-0 ${
                isMinimized || isMediumScreen ? "" : "right-0"
              } mb-2 bg-white rounded-md border border-gray-200`}
            >
              <button
                onClick={handleLogout}
                className="flex w-full cursor-pointer items-center gap-3 lg:gap-4 p-2 lg:p-3 hover:bg-gray-100 text-left text-red-600"
              >
                <LuLogOut className="w-4 lg:w-5" />
                {!isMinimized && !isMediumScreen && (
                  <span className="text-sm lg:text-base">Logout</span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
