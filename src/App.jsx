import { Link, Outlet, useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { supabase } from "./config/env";
import { UserContext, SidenavContext } from "./context/contexts";
import { InstituteContext, SessionContext } from "./context/contexts";
import { useNotifications } from "./context/notificationContext";
import { LucideSidebarClose, LucideSidebarOpen } from "lucide-react";
import { Sidenav } from "./components/sidenav";
import Chat from "./pages/chat";
import { Toaster } from "react-hot-toast";

function App() {
  const { login } = useContext(UserContext);
  const { setInstitute } = useContext(InstituteContext);
  const { setSession } = useContext(SessionContext);
  const { setUser } = useNotifications();
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMobileSidenavOpen, setIsMobileSidenavOpen] = useState(false);
  const [isMediumScreen, setIsMediumScreen] = useState(false);
  const navigation = useNavigate();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setIsMediumScreen(window.innerWidth >= 768 && window.innerWidth < 1024);
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
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
      console.log(data);
      if (data?.user) {
        login(data.user);
        setUser(data.user); // Set user for notifications
        console.log(data.user.id);
        localStorage.setItem("user_id", data.user.id);

        const { data: userData, error: userError } = await supabase
          .from("students")
          .select("*")
          .eq("user_id", data.user.id)
          .single();

        if (userError) {
          console.error("Error fetching user data:", userError);
          // stop loading and navigate to login as fallback
          setLoading(false);
          clearInterval(progressInterval);
          return;
        }

        localStorage.setItem("student_id", userData.id);

        try {
          // Fetch institute details and set in context so dependent components can load immediately
          if (userData?.institute_id) {
            const { data: instituteData, error: instError } = await supabase
              .from("institutes")
              .select("*")
              .eq("id", userData.institute_id)
              .single();

            if (!instError && instituteData) {
              setInstitute(instituteData);
            } else if (instError) {
              console.error("Error fetching institute:", instError);
            }
          }

          // Fetch session details if available
          if (userData?.session_id) {
            const { data: sessionData, error: sessError } = await supabase
              .from("sessions")
              .select("*")
              .eq("id", userData.session_id)
              .single();

            if (!sessError && sessionData) {
              setSession(sessionData);
            } else if (sessError) {
              console.error("Error fetching session:", sessError);
            }
          }
        } catch (e) {
          console.error("Error fetching institute/session:", e);
        }

        setProgress(100);
        setTimeout(() => setLoading(false), 50); // allow bar to finish
        clearInterval(progressInterval);
      } else {
        setLoading(false);
        clearInterval(progressInterval);
        navigation("/login");
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, []);

  return (
    <SidenavContext.Provider value={{ isMinimized, setIsMinimized }}>
      <div>
        {loading && (
          <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white transition-all">
            <h1
              className="text-4xl font-black text-blue-600 mb-4 tracking-wide"
              style={{ letterSpacing: "0.05em" }}
            >
              MEducation
            </h1>
            <div className="relative w-[120px] h-2 bg-zinc-200 rounded-full overflow-hidden mb-2">
              <div
                className="absolute left-0 top-0 h-full bg-blue-500 transition-all duration-200"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
        <div className="sm:flex w-full h-screen">
          <div className="block sm:hidden">
            <div className="flex items-center border-b border-gray-200 justify-between">
              <div className="flex-1">
                <div className="text-left ml-2 select-none flex items-center p-1 font-bold text-xl py-4 cursor-pointer hover:text-zinc-800 transition-colors">
                  <Link to="/">
                    <h1 className="text-center text-2xl font-semibold p-1">
                      MEd Student
                    </h1>
                  </Link>
                </div>
              </div>
              <div
                className="hover:bg-gray-100 rounded-md mx-2 px-4 py-4"
                onClick={() => setIsMobileSidenavOpen(true)}
              >
                {isMobileSidenavOpen ? (
                  <LucideSidebarClose />
                ) : (
                  <LucideSidebarOpen />
                )}
              </div>
            </div>
          </div>
          <div
            className={`fixed sm:sticky top-0 h-screen rounded-lg p-2 sm:block transition-all duration-300 ${
              isMinimized || isMediumScreen
                ? "sm:w-20"
                : "sm:w-3/12 md:w-2/12 lg:w-2/12 xl:w-2/12"
            } ${
              isMobileSidenavOpen
                ? "top-0 left-0 w-[80%] block"
                : "-left-full hidden"
            }  z-50`}
          >
            <Sidenav />
          </div>

          {isMobileSidenavOpen && (
            <div
              className="fixed inset-0 bg-black/10 z-40 sm:hidden"
              onClick={() => setIsMobileSidenavOpen(false)}
            />
          )}

          <div className="flex-1 pr-2 h-screen overflow-y-auto">
            <div
              className={`w-full rounded-lg my-2 transition-all duration-300 px-4 py-1`}
            >
              <Outlet />
            </div>
          </div>
        </div>
        <Chat />
        <Toaster position="top-right" />
      </div>
    </SidenavContext.Provider>
  );
}

export default App;
