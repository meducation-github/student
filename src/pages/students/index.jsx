import { useState, useEffect, useContext } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  Eye,
  Users,
  BarChart2,
} from "lucide-react";
import { supabase } from "../../config/env";
import PageHeader from "../../components/pageHeader";
import { InstituteContext } from "../../context/contexts";

// Main component
export default function Students() {
  const { instituteState } = useContext(InstituteContext);
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("list"); // 'list' or 'analytics'
  const studentsPerPage = 10;

  // Fetch grades from Supabase
  const fetchGrades = async () => {
    const { data, error } = await supabase
      .from("grades")
      .select("*")
      .eq("institute_id", instituteState.id)
      .order("level");

    if (error) {
      console.error("Error fetching grades:", error);
    } else {
      setGrades(data || []);
    }
  };

  // Fetch students from Supabase
  const fetchStudents = async () => {
    setIsLoading(true);
    const startIndex = (currentPage - 1) * studentsPerPage;

    let query = supabase
      .from("students")
      .select(
        `
          *,
          grades (
            id,
            name,
            level
          )
        `,
        { count: "exact" }
      )
      .eq("institute_id", instituteState.id)
      .order("created_at", { ascending: false });

    // Add search functionality
    if (searchTerm) {
      query = query.or(
        `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`
      );
    }

    // Add grade filter
    if (selectedGrade) {
      query = query.eq("grade", selectedGrade);
    }

    const { data, count, error } = await query.range(
      startIndex,
      startIndex + studentsPerPage - 1
    );

    if (error) {
      console.error("Error fetching students:", error);
    } else {
      setStudents(data || []);
      setTotalPages(Math.ceil((count || 0) / studentsPerPage));
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchGrades();
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchStudents();
    }, 300); // Debounce search and filter changes

    return () => clearTimeout(debounceTimer);
  }, [currentPage, searchTerm, selectedGrade]);

  // Handle view student
  const handleViewStudent = (student) => {
    setCurrentStudent(student);
    setIsViewModalOpen(true);
  };

  // Handle edit student
  const handleEditStudent = (student) => {
    setCurrentStudent(student);
    setIsEditModalOpen(true);
  };

  // Handle delete student
  const handleDeleteStudent = async (id) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      const { error } = await supabase.from("students").delete().eq("id", id);

      if (error) {
        console.error("Error deleting student:", error);
        alert("Failed to delete student");
      } else {
        fetchStudents();
      }
    }
  };

  return (
    <div className="">
      <PageHeader title={"Students"} subtitle={`Manage your students.`} />
      <div className="px-4">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-4 mt-2">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("list")}
              className={`${
                activeTab === "list"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <Users size={18} />
              Students List
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`${
                activeTab === "analytics"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <BarChart2 size={18} />
              Analytics
            </button>
          </nav>
        </div>

        {activeTab === "list" ? (
          <>
            {/* Search and Add Student Section */}
            <div className="flex justify-between items-center mt-4 mb-4">
              <div className="flex gap-4">
                <div className="relative w-64">
                  <input
                    type="text"
                    placeholder="Search students..."
                    className="pl-10 pr-4 py-2 border bg-white border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search
                    className="absolute left-3 top-2.5 text-gray-400"
                    size={18}
                  />
                </div>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="px-4 py-2 border bg-white border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Grades</option>
                  {grades.map((grade) => (
                    <option key={grade.id} value={grade.id}>
                      {grade.name || `Grade ${grade.level}`}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="bg-blue-100 text-blue-600 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-200 transition-colors"
                onClick={() => setIsAddModalOpen(true)}
              >
                <Plus size={18} />
                Add Student
              </button>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Father's Name
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        Loading students...
                      </td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        No students found
                      </td>
                    </tr>
                  ) : (
                    students.map((student) => (
                      <tr
                        key={student.id}
                        className="hover:bg-gray-50"
                        onClick={() => handleViewStudent(student)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {student.first_name} {student.last_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {student?.grades?.level}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              student.status === "Active"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {student.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.father_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEditStudent(student)}
                              className="text-yellow-600 hover:text-yellow-800"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(student.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-500">
                Showing{" "}
                {students.length > 0
                  ? (currentPage - 1) * studentsPerPage + 1
                  : 0}{" "}
                to{" "}
                {Math.min(
                  currentPage * studentsPerPage,
                  (currentPage - 1) * studentsPerPage + students.length
                )}{" "}
                of {totalPages * studentsPerPage} students
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-md ${
                    currentPage === 1
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-blue-600 hover:bg-blue-100"
                  }`}
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-md ${
                    currentPage === totalPages
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-blue-600 hover:bg-blue-100"
                  }`}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="mt-4">
            <GradeAnalytics grades={grades} instituteId={instituteState.id} />
          </div>
        )}

        {/* Modals */}
        {isAddModalOpen && (
          <StudentFormModal
            onClose={() => setIsAddModalOpen(false)}
            onSuccess={() => {
              setIsAddModalOpen(false);
              fetchStudents();
            }}
            instituteId={instituteState.id}
          />
        )}

        {isViewModalOpen && currentStudent && (
          <StudentViewModal
            student={currentStudent}
            onClose={() => setIsViewModalOpen(false)}
          />
        )}

        {isEditModalOpen && currentStudent && (
          <StudentFormModal
            student={currentStudent}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={() => {
              setIsEditModalOpen(false);
              fetchStudents();
            }}
            instituteId={instituteState.id}
          />
        )}
      </div>
    </div>
  );
}

// Student Form Modal Component
function StudentFormModal({ student, onClose, onSuccess, instituteId }) {
  const isEditing = !!student;
  const [formData, setFormData] = useState({
    first_name: student?.first_name || "",
    last_name: student?.last_name || "",
    father_name: student?.father_name || "",
    address: student?.address || "",
    grade: student?.grade.id,
    status: student?.status || "Active",
    phone: student?.phone || "",
    email: student?.email || "",
    date_of_birth: student?.date_of_birth || "",
    admission_date:
      student?.admission_date || new Date().toISOString().split("T")[0],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [grades, setGrades] = useState([]);

  useEffect(() => {
    const fetchGrades = async () => {
      const { data, error } = await supabase
        .from("grades")
        .select("*")
        .eq("institute_id", instituteId);

      if (error) {
        console.error("Error fetching grades:", error);
      } else {
        setGrades(data);
      }
    };
    fetchGrades();
  }, [instituteId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    console.log("test", formData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const studentData = {
      ...formData,
      institute_id: instituteId,
      grade: formData.grade, // This is already a UUID from the grades table
    };
    console.log("test", studentData);
    let error;
    let newStudentId;

    if (isEditing) {
      // Update existing student
      const { error: updateError } = await supabase
        .from("students")
        .update(studentData)
        .eq("id", student.id);
      error = updateError;
    } else {
      // Create new student
      const { data: newStudent, error: insertError } = await supabase
        .from("students")
        .insert([studentData])
        .select()
        .single();
      error = insertError;
      newStudentId = newStudent?.id;
    }

    if (error) {
      console.error("Error saving student:", error);
      alert("Failed to save student");
      setIsSubmitting(false);
      return;
    }

    // If this is a new student, create fees
    if (!isEditing && newStudentId) {
      try {
        // Get the grade level from the selected grade
        const { data: gradeData, error: gradeError } = await supabase
          .from("grades")
          .select("level")
          .eq("id", formData.grade)
          .single();

        if (gradeError) {
          console.error("Error fetching grade:", gradeError);
          return;
        }

        // Get the fee structure for the selected grade
        const { data: feeStructure, error: feeStructureError } = await supabase
          .from("fee_structures")
          .select("*")
          .eq("grade", gradeData.level)
          .eq("institute_id", instituteId)
          .single();

        if (feeStructureError) {
          console.error("Error fetching fee structure:", feeStructureError);
          return;
        }

        // Get the current session
        const { data: session, error: sessionError } = await supabase
          .from("sessions")
          .select("*")
          .eq("institute_id", instituteId)
          .eq("is_active", true)
          .single();

        if (sessionError) {
          console.error("Error fetching session:", sessionError);
          return;
        }

        // Calculate fee cycles based on fee_cycle
        const cycles = [];
        const startDate = new Date(session.start_date);
        const endDate = new Date(session.end_date);

        if (feeStructure.fee_cycle === "monthly") {
          // Create 12 monthly cycles
          for (let i = 0; i < 12; i++) {
            const cycleStart = new Date(startDate);
            cycleStart.setMonth(startDate.getMonth() + i);
            const cycleEnd = new Date(cycleStart);
            cycleEnd.setMonth(cycleStart.getMonth() + 1);
            cycleEnd.setDate(0); // Last day of the month

            if (cycleStart <= endDate) {
              cycles.push({
                start: cycleStart,
                end: cycleEnd,
              });
            }
          }
        } else if (feeStructure.fee_cycle === "quarterly") {
          // Create 4 quarterly cycles
          for (let i = 0; i < 4; i++) {
            const cycleStart = new Date(startDate);
            cycleStart.setMonth(startDate.getMonth() + i * 3);
            const cycleEnd = new Date(cycleStart);
            cycleEnd.setMonth(cycleStart.getMonth() + 3);
            cycleEnd.setDate(0); // Last day of the month

            if (cycleStart <= endDate) {
              cycles.push({
                start: cycleStart,
                end: cycleEnd,
              });
            }
          }
        }

        // Create fee records for each cycle
        const feeRecords = cycles.map((cycle) => ({
          student_id: newStudentId,
          fee_structure_id: feeStructure.id,
          total_fee: feeStructure.total_amount,
          paid_fee: 0,
          payment_status: "pending",
          fee_cycle: feeStructure.fee_cycle,
          cycle_start_date: cycle.start.toISOString().split("T")[0],
          cycle_end_date: cycle.end.toISOString().split("T")[0],
          is_current_cycle: false,
          sub_fees: feeStructure.sub_fees,
        }));

        // Insert fee records
        const { error: feesError } = await supabase
          .from("fees")
          .insert(feeRecords);

        if (feesError) {
          console.error("Error creating fees:", feesError);
        }
      } catch (err) {
        console.error("Error in fee creation process:", err);
      }
    }

    setIsSubmitting(false);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/25  flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-blue-600">
            {isEditing ? "Edit Student" : "Add New Student"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Father's Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Father's Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="father_name"
                value={formData.father_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Grade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grade <span className="text-red-500">*</span>
              </label>
              <select
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {grades.map((grade) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.name} - {grade.level}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Graduated">Graduated</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Admission Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admission Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="admission_date"
                value={formData.admission_date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Address - Full Width */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address <span className="text-red-500">*</span>
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2"
            >
              {isSubmitting ? (
                "Saving..."
              ) : (
                <>
                  <Save size={16} />
                  {isEditing ? "Update Student" : "Add Student"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Student View Modal Component
function StudentViewModal({ student, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/25 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-blue-600">Student Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
              <p className="mt-1 text-base font-medium">
                {student.first_name} {student.last_name}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Father's Name
              </h3>
              <p className="mt-1 text-base">{student.father_name}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Grade</h3>
              <p className="mt-1 text-base">
                {student.grades.name} - {student.grades.level}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <p className="mt-1">
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    student.status === "Active"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {student.status}
                </span>
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Phone</h3>
              <p className="mt-1 text-base">{student.phone || "N/A"}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Email</h3>
              <p className="mt-1 text-base">{student.email || "N/A"}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Date of Birth
              </h3>
              <p className="mt-1 text-base">{student.date_of_birth || "N/A"}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Admission Date
              </h3>
              <p className="mt-1 text-base">{student.admission_date}</p>
            </div>

            <div className="col-span-2">
              <h3 className="text-sm font-medium text-gray-500">Address</h3>
              <p className="mt-1 text-base">{student.address}</p>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Grade Analytics Component
function GradeAnalytics({ grades, instituteId }) {
  const [gradeStats, setGradeStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGradeStats = async () => {
      setIsLoading(true);

      const { data, error } = await supabase.rpc(
        "get_student_counts_by_grade",
        { institute_id: instituteId }
      );

      if (error) {
        console.error("Error fetching grade stats:", error);
        setGradeStats(grades.map((grade) => ({ ...grade, studentCount: 0 })));
      } else {
        const stats = grades.map((grade) => ({
          ...grade,
          studentCount: data.find((d) => d.grade === grade.id)?.count || 0,
        }));
        setGradeStats(stats);
      }

      setIsLoading(false);
    };

    if (grades.length > 0 && instituteId) {
      fetchGradeStats();
    }
  }, [grades, instituteId]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
      {gradeStats.map((grade) => (
        <div
          key={grade.id}
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex flex-col">
            <h3 className="text-lg font-medium text-gray-500 mb-2">
              {grade.name || `Grade ${grade.level}`}
            </h3>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-blue-600">
                {grade.studentCount}
              </p>
              <p className="text-sm text-gray-500">students</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
