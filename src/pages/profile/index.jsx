import { useState, useEffect } from "react";
import PageHeader from "../../components/pageHeader";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  School,
  GraduationCap,
  Save,
} from "lucide-react";
import { supabase } from "../../config/env";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

const STUDENT_ID = localStorage.getItem("student_id");

const Profile = () => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedFields, setEditedFields] = useState({});

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("id", STUDENT_ID)
        .single();

      if (error) throw error;
      setStudent(data);
      setEditedFields(data);
    } catch (error) {
      console.error("Error fetching student:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedFields((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from("students")
        .update({
          first_name: editedFields.first_name,
          last_name: editedFields.last_name,
          address: editedFields.address,
          updated_at: new Date(),
        })
        .eq("id", STUDENT_ID);

      if (error) throw error;
      setIsEditing(false);
      fetchStudentData();
    } catch (error) {
      console.error("Error updating student:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">Loading...</div>
    );
  }

  return (
    <div className="">
      <PageHeader
        title={"Profile"}
        subtitle={`See your profile details and update them if needed.`}
      />

      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg p-6 mt-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              Basic Information
            </h2>
            <Button
              onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
              className="flex items-center"
              size="sm"
            >
              {isEditing ? (
                <>
                  <Save size={16} className="mr-2" />
                  Save Changes
                </>
              ) : (
                "Edit Profile"
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Editable Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <div className="relative">
                  <User
                    size={20}
                    className="absolute left-3 top-2.5 text-gray-400"
                  />
                  <Input
                    type="text"
                    name="first_name"
                    value={editedFields.first_name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="pl-10 pr-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <div className="relative">
                  <User
                    size={20}
                    className="absolute left-3 top-2.5 text-gray-400"
                  />
                  <Input
                    type="text"
                    name="last_name"
                    value={editedFields.last_name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="pl-10 pr-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <div className="relative">
                  <MapPin
                    size={20}
                    className="absolute left-3 top-2.5 text-gray-400"
                  />
                  <Input
                    type="text"
                    name="address"
                    value={editedFields.address}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="pl-10 pr-3 py-2"
                  />
                </div>
              </div>
            </div>

            {/* Non-editable Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    size={20}
                    className="absolute left-3 top-2.5 text-gray-400"
                  />
                  <Input
                    type="email"
                    value={student?.email || "Not provided"}
                    disabled
                    className="pl-10 pr-3 py-2 bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <div className="relative">
                  <Phone
                    size={20}
                    className="absolute left-3 top-2.5 text-gray-400"
                  />
                  <Input
                    type="tel"
                    value={student?.phone || "Not provided"}
                    disabled
                    className="pl-10 pr-3 py-2 bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <div className="relative">
                  <Calendar
                    size={20}
                    className="absolute left-3 top-2.5 text-gray-400"
                  />
                  <Input
                    type="text"
                    value={student?.date_of_birth || "Not provided"}
                    disabled
                    className="pl-10 pr-3 py-2 bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admission Date
                </label>
                <div className="relative">
                  <School
                    size={20}
                    className="absolute left-3 top-2.5 text-gray-400"
                  />
                  <Input
                    type="text"
                    value={new Date(
                      student?.admission_date
                    ).toLocaleDateString()}
                    disabled
                    className="pl-10 pr-3 py-2 bg-gray-50"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
