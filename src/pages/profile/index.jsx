import { useContext, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { supabase } from "../../config/env";
import { UserContext, InstituteContext } from "../../context/contexts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import {
  LucideUserCog,
  LucideCalendar,
  LucideSchool,
  LucideMapPin,
  LucideMail,
  LucidePhone,
  LucideUser,
} from "lucide-react";

const Profile = () => {
  const { studentData, setStudent } = useContext(UserContext);
  const { instituteState } = useContext(InstituteContext);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentData) {
      setFormData({
        first_name: studentData.first_name || "",
        last_name: studentData.last_name || "",
        email: studentData.email || "",
        phone: studentData.phone || "",
        address: studentData.address || "",
      });
      setLoading(false);
    }
  }, [studentData]);

  const quickFacts = useMemo(
    () => [
      {
        label: "Enrollment ID",
        value: studentData?.id?.slice(0, 8) || "Unavailable",
        icon: LucideUser,
      },
      {
        label: "Grade",
        value: studentData?.grade_name || studentData?.grade || "Not assigned",
        icon: LucideSchool,
      },
      {
        label: "Joined",
        value: studentData?.admission_date
          ? new Date(studentData.admission_date).toLocaleDateString()
          : "Pending",
        icon: LucideCalendar,
      },
      {
        label: "Institute",
        value: instituteState?.name || "Not connected",
        icon: LucideMapPin,
      },
    ],
    [instituteState?.name, studentData]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!studentData?.id) return;
    setIsSaving(true);
    try {
      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        address: formData.address,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("students")
        .update(payload)
        .eq("id", studentData.id)
        .select()
        .single();

      if (error) throw error;
      setStudent({ ...studentData, ...data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Unable to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white/60 p-8 text-center shadow-sm">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white/80 p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Profile
        </p>
        <h1 className="mt-1 text-3xl font-bold text-foreground">
          Keep your student information up to date
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Accurate details help your institute stay in touch about attendance,
          studies, and fees in real time.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickFacts.map((fact) => (
          <Card key={fact.label} className="bg-white/90">
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                <fact.icon className="h-5 w-5" />
              </div>
              <div>
                <CardDescription>{fact.label}</CardDescription>
                <CardTitle className="text-lg">{fact.value}</CardTitle>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <LucideUserCog className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Contact information</CardTitle>
              <CardDescription>
                Update your name, phone and address details.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First name</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last name</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+92 300 0000000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={formData.email} disabled />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  name="address"
                  rows={3}
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street, city, country"
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving} className="min-w-[140px]">
                  {isSaving ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Institutional record</CardTitle>
              <CardDescription>Stored details from your institute.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <LucideMail className="h-4 w-4" />
                {studentData?.email || "Email not set"}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <LucidePhone className="h-4 w-4" />
                {studentData?.phone || "Phone not set"}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <LucideMapPin className="h-4 w-4" />
                {studentData?.address || "Address not set"}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
