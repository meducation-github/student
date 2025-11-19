import { useContext, useEffect, useMemo, useState } from "react";
import {
  LucideExternalLink,
  LucideGraduationCap,
  LucideLoader2,
  LucideNotebook,
  LucideSparkles,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { supabase } from "../../config/env";
import { UserContext } from "../../context/contexts";
import { toast } from "react-hot-toast";

const Curriculum = () => {
  const { studentData } = useContext(UserContext);
  const studentId = studentData?.id || localStorage.getItem("student_id");
  const [grade, setGrade] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoLoginLoading, setAutoLoginLoading] = useState(false);

  useEffect(() => {
    if (!studentId) {
      setError("Student account not found");
      setLoading(false);
      return;
    }

    const fetchCurriculum = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: studentRecord, error: studentError } = await supabase
          .from("students")
          .select(
            `
            grade,
            grades (
              id,
              name,
              description,
              level
            )
          `
          )
          .eq("id", studentId)
          .single();

        if (studentError) throw studentError;

        setGrade(studentRecord?.grades || null);

        if (studentRecord?.grade) {
          const { data: subjectsData, error: subjectsError } = await supabase
            .from("subjects_courses")
            .select("*")
            .eq("grade_id", studentRecord.grade)
            .order("name");

          if (subjectsError) throw subjectsError;
          setSubjects(subjectsData || []);
        } else {
          setSubjects([]);
        }
      } catch (curriculumError) {
        console.error("Error fetching curriculum:", curriculumError);
        setError(curriculumError.message || "Unable to load curriculum");
      } finally {
        setLoading(false);
      }
    };

    fetchCurriculum();
  }, [studentId]);

  const handleAutoLogin = async () => {
    setAutoLoginLoading(true);
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw new Error("Failed to locate your session");
      if (!session) throw new Error("Please login again to continue.");

      const { data: linkData, error: linkError } =
        await supabase.auth.admin.generateLink({
          type: "magiclink",
          email: session.user.email,
          options: {
            redirectTo: "https://courses.meducation.pk",
          },
        });

      if (linkError) throw linkError;
      window.open(linkData.properties.action_link, "_blank", "noopener,noreferrer");
    } catch (autoLoginError) {
      console.error("Auto-login error:", autoLoginError);
      toast.error(autoLoginError.message || "Unable to auto-login right now");
    } finally {
      setAutoLoginLoading(false);
    }
  };

  const summary = useMemo(
    () => ({
      subjectCount: subjects.length,
      level: grade?.level ? `Level ${grade.level}` : "Level pending",
      description: grade?.description || "Your institute will add a description soon.",
    }),
    [grade, subjects.length]
  );

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-10 text-center text-muted-foreground">
          Loading studies...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/5 shadow-sm">
        <CardHeader>
          <CardTitle className="text-destructive">Unable to load studies</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white/80 p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Studies
        </p>
        <h1 className="mt-1 text-3xl font-bold text-foreground">
          Everything for your current grade
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Review your grade details, explore subjects, and launch the MEducation courses portal with one click.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <LucideGraduationCap className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>{grade?.name || "Grade information pending"}</CardTitle>
              <CardDescription>{summary.description}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border bg-muted/30 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Grade
                </p>
                <p className="mt-1 text-xl font-semibold text-foreground">
                  {grade?.name || "Not set"}
                </p>
              </div>
              <div className="rounded-xl border bg-muted/30 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Level
                </p>
                <p className="mt-1 text-xl font-semibold text-foreground">
                  {summary.level}
                </p>
              </div>
              <div className="rounded-xl border bg-muted/30 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Subjects
                </p>
                <p className="mt-1 text-xl font-semibold text-foreground">
                  {summary.subjectCount}
                </p>
              </div>
            </div>

            <div>
              <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                <LucideNotebook className="h-5 w-5 text-primary" />
                Subjects in this grade
              </h3>
              {subjects.length === 0 ? (
                <div className="rounded-xl border border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                  Your institute will assign subjects soon.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {subjects.map((subject) => (
                    <div
                      key={subject.id}
                      className="rounded-xl border bg-white/70 p-4 shadow-sm transition hover:shadow-md"
                    >
                      <p className="text-base font-semibold text-foreground">
                        {subject.name}
                      </p>
                      {subject.code && (
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Code: {subject.code}
                        </p>
                      )}
                      {subject.description && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {subject.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <LucideSparkles className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Auto-login to courses</CardTitle>
                <CardDescription>
                  Jump straight into courses.meducation.pk
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                We’ll generate a one-time secure link and open your courses portal in a new tab.
              </p>
              <Button
                className="w-full"
                onClick={handleAutoLogin}
                disabled={autoLoginLoading}
              >
                {autoLoginLoading ? (
                  <>
                    <LucideLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging you in...
                  </>
                ) : (
                  <>
                    <LucideExternalLink className="mr-2 h-4 w-4" />
                    Open courses portal
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Curriculum;
