import { useState, useContext, useEffect } from "react";
import { GraduationCap, BookOpen, ExternalLink, Loader2 } from "lucide-react";
import { InstituteContext, UserContext } from "../../context/contexts.jsx";
import PageHeader from "../../components/pageHeader.jsx";
import { supabase } from "../../config/env";

const STUDENT_ID = "22005ab9-d995-4a57-851f-7a7ad45a92cb";

export default function Curriculum() {
  const { instituteState } = useContext(InstituteContext);
  const { authState } = useContext(UserContext);
  const [studentGrade, setStudentGrade] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false);

  useEffect(() => {
    fetchStudentGradeAndSubjects();
  }, []);

  const fetchStudentGradeAndSubjects = async () => {
    setIsLoading(true);
    try {
      // Get student's grade
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("grade")
        .eq("id", STUDENT_ID);

      if (studentError) throw studentError;

      if (studentData && studentData.length > 0) {
        // Get grade details
        const { data: gradeData, error: gradeError } = await supabase
          .from("grades")
          .select("*")
          .eq("id", studentData[0].grade);

        if (gradeError) throw gradeError;
        setStudentGrade(gradeData[0]);

        // Get subjects for this grade
        const { data: subjectsData, error: subjectsError } = await supabase
          .from("subjects_courses")
          .select("*")
          .eq("grade_id", studentData[0].grade)
          .order("name");

        if (subjectsError) throw subjectsError;
        setSubjects(subjectsData || []);
      }
    } catch (error) {
      setError("Failed to fetch data: " + error.message);
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoLogin = async () => {
    setIsAutoLoggingIn(true);
    try {
      // Get current user session from Supabase
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw new Error("Failed to get current session");
      }

      if (!session) {
        throw new Error("No active session found. Please log in first.");
      }

      // Get user email from session
      const userEmail = session.user.email;

      if (!userEmail) {
        throw new Error("User email not found in session");
      }

      // Generate magic link for courses website using Supabase admin
      const { data: linkData, error: linkError } =
        await supabase.auth.admin.generateLink({
          type: "magiclink",
          email: userEmail,
          options: {
            redirectTo: "https://courses.meducation.pk",
          },
        });

      if (linkError) {
        console.error("Error generating link:", linkError);
        throw new Error("Failed to generate auto-login link");
      }

      // Open the generated magic link in new tab
      window.open(linkData.properties.action_link, "_blank");
    } catch (error) {
      console.error("Auto login error:", error);
      setError("Failed to auto-login: " + error.message);
    } finally {
      setIsAutoLoggingIn(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="">
      <PageHeader title={"Studies"} subtitle={"View your grade and subjects"} />

      {/* Auto Login Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-lg mr-3">
              <ExternalLink size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Access Your Courses
              </h3>
              <p className="text-sm text-gray-600">
                Auto-login to courses.meducation.pk to study and access course
                materials
              </p>
            </div>
          </div>
          <button
            onClick={handleAutoLogin}
            disabled={isAutoLoggingIn}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
          >
            {isAutoLoggingIn ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Logging in...
              </>
            ) : (
              <>
                <ExternalLink size={16} />
                Auto Login
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg overflow-hidden">
        {!studentGrade ? (
          <div className="text-center py-12 px-4">
            <GraduationCap size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              No grade information found
            </h3>
            <p className="text-gray-500">
              Please contact your administrator to set up your grade
            </p>
          </div>
        ) : (
          <div className="p-6">
            {/* Grade Information */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <GraduationCap size={24} className="text-blue-600 mr-2" />
                <h3 className="text-xl font-semibold text-gray-900">
                  Grade Information
                </h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">
                      Grade Name
                    </h4>
                    <p className="text-gray-900">{studentGrade.name}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">
                      Grade Level
                    </h4>
                    <p className="text-gray-900">{studentGrade.level}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">
                      Description
                    </h4>
                    <p className="text-gray-900">
                      {studentGrade.description || "No description available"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Subjects List */}
            <div>
              <div className="flex items-center mb-4">
                <BookOpen size={24} className="text-blue-600 mr-2" />
                <h3 className="text-xl font-semibold text-gray-900">
                  Subjects
                </h3>
              </div>

              {subjects.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">
                    No subjects available for this grade
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subjects.map((subject) => (
                    <div
                      key={subject.id}
                      className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                    >
                      <h4 className="font-medium text-gray-900 mb-1">
                        {subject.name}
                      </h4>
                      {subject.code && (
                        <p className="text-sm text-gray-500 mb-2">
                          Code: {subject.code}
                        </p>
                      )}
                      {subject.description && (
                        <p className="text-sm text-gray-600">
                          {subject.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
