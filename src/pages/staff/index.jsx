import { useState, useEffect, useContext } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Calendar,
  DollarSign,
  BookOpen,
  User,
} from "lucide-react";
import { supabase } from "../../config/env";
import PageHeader from "../../components/pageHeader";
import { InstituteContext } from "../../context/contexts";

export default function Staff() {
  const { instituteState } = useContext(InstituteContext);
  // State for staff data
  const [staff, setStaff] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentStaff, setCurrentStaff] = useState(null);

  // State for pagination
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // State for search
  const [searchQuery, setSearchQuery] = useState("");

  // Initial data fetch
  useEffect(() => {
    if (instituteState?.id) {
      fetchStaff();
    }
  }, [page, pageSize, searchQuery, instituteState?.id]);

  // Function to fetch staff from Supabase
  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      // Create a query to fetch staff data with pagination
      let query = supabase
        .from("staff")
        .select("*", { count: "exact" })
        .eq("institute_id", instituteState.id)
        .range(page * pageSize, (page + 1) * pageSize - 1)
        .order("created_at", { ascending: false });

      // Add search filter if a search query exists
      if (searchQuery) {
        query = query.or(
          `name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`
        );
      }

      const { data, count, error } = await query;

      if (error) throw error;

      setStaff(data);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error fetching staff:", error);
      setError("Failed to fetch staff data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to add a new staff member
  const addStaff = async (staffData) => {
    try {
      const { data, error } = await supabase
        .from("staff")
        .insert([{ ...staffData, institute_id: instituteState.id }])
        .select();

      if (error) throw error;

      await fetchStaff();
      return { success: true };
    } catch (error) {
      console.error("Error adding staff:", error);
      return { success: false, error: error.message };
    }
  };

  // Function to update a staff member
  const updateStaff = async (id, staffData) => {
    try {
      const { error } = await supabase
        .from("staff")
        .update(staffData)
        .eq("id", id);

      if (error) throw error;

      await fetchStaff();
      return { success: true };
    } catch (error) {
      console.error("Error updating staff:", error);
      return { success: false, error: error.message };
    }
  };

  // Function to delete a staff member
  const deleteStaff = async (id) => {
    if (window.confirm("Are you sure you want to delete this staff member?")) {
      try {
        const { error } = await supabase.from("staff").delete().eq("id", id);

        if (error) throw error;

        await fetchStaff();
      } catch (error) {
        console.error("Error deleting staff:", error);
        setError("Failed to delete staff member. Please try again later.");
      }
    }
  };

  // Handler for opening edit modal
  const handleEditClick = (staff) => {
    setCurrentStaff(staff);
    setIsEditModalOpen(true);
  };

  // Handler for opening view modal
  const handleViewClick = (staff) => {
    setCurrentStaff(staff);
    setIsViewModalOpen(true);
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="">
      <PageHeader title={"Staff"} subtitle={`Manage your staff.`} />

      <div className="mt-6">
        {/* Search and Add Staff Bar */}
        <div className="flex justify-between mb-6">
          <div className="relative flex items-center">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search staff..."
              className="pl-10 pr-4 py-2 border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={18} />
            Add Staff
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Staff Table */}
        <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Designation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y text-sm divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  </td>
                </tr>
              ) : staff.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No staff members found
                  </td>
                </tr>
              ) : (
                staff.map((staffMember) => (
                  <tr key={staffMember.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {staffMember.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">{staffMember.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">{staffMember.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">
                        {staffMember.department}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">
                        {staffMember.designation}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleViewClick(staffMember)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEditClick(staffMember)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => deleteStaff(staffMember.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
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

          {/* Pagination */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 sm:px-6 flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  page === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  page >= totalPages - 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{" "}
                  <span className="font-medium">{page * pageSize + 1}</span> to{" "}
                  <span className="font-medium">
                    {Math.min((page + 1) * pageSize, totalCount)}
                  </span>{" "}
                  of <span className="font-medium">{totalCount}</span> results
                </p>
              </div>
              <div>
                <nav
                  className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                      page === 0
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>

                  {/* Page numbers */}
                  {[...Array(totalPages).keys()].map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === pageNum
                          ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                      page >= totalPages - 1
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>

        {/* Add Staff Modal */}
        {isAddModalOpen && (
          <StaffFormModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSubmit={addStaff}
            title="Add New Staff Member"
          />
        )}

        {/* Edit Staff Modal */}
        {isEditModalOpen && currentStaff && (
          <StaffFormModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSubmit={(data) => updateStaff(currentStaff.id, data)}
            title="Edit Staff Member"
            initialData={currentStaff}
          />
        )}

        {/* View Staff Modal */}
        {isViewModalOpen && currentStaff && (
          <StaffViewModal
            isOpen={isViewModalOpen}
            onClose={() => setIsViewModalOpen(false)}
            staff={currentStaff}
          />
        )}
      </div>
    </div>
  );
}

// Staff Form Modal Component
function StaffFormModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  initialData = {},
}) {
  const [formData, setFormData] = useState({
    name: initialData.name || "",
    email: initialData.email || "",
    phone: initialData.phone || "",
    department: initialData.department || "",
    designation: initialData.designation || "",
    address: initialData.address || "",
    joining_date: initialData.joining_date || "",
    salary: initialData.salary || "",
    is_active:
      initialData.is_active === undefined ? true : initialData.is_active,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await onSubmit(formData);
      if (result.success) {
        onClose();
      } else {
        setError(result.error || "An error occurred");
      }
    } catch (error) {
      setError("Failed to submit form");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/25 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Personal Information
              </h3>

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  className="mt-1 block w-full py-2 px-3 rounded-md border border-gray-300 outline-none focus:border-blue-500 focus:ring-blue-500"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  required
                  className="mt-1 block w-full py-2 px-3 rounded-md border border-gray-300 outline-none focus:border-blue-500 focus:ring-blue-500"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700"
                >
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  required
                  className="mt-1 block w-full py-2 px-3 rounded-md border border-gray-300 outline-none focus:border-blue-500 focus:ring-blue-500"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700"
                >
                  Address
                </label>
                <textarea
                  name="address"
                  id="address"
                  rows="3"
                  className="mt-1 block w-full py-2 px-3 rounded-md border border-gray-300 outline-none focus:border-blue-500 focus:ring-blue-500"
                  value={formData.address}
                  onChange={handleChange}
                ></textarea>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Professional Information
              </h3>

              <div>
                <label
                  htmlFor="department"
                  className="block text-sm font-medium text-gray-700"
                >
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  name="department"
                  id="department"
                  required
                  className="mt-1 block w-full py-2 px-3 rounded-md border border-gray-300 outline-none focus:border-blue-500 focus:ring-blue-500"
                  value={formData.department}
                  onChange={handleChange}
                >
                  <option value="">Select a department</option>
                  <option value="Administration">Administration</option>
                  <option value="Science">Science</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="English">English</option>
                  <option value="Social Studies">Social Studies</option>
                  <option value="Arts">Arts</option>
                  <option value="Physical Education">Physical Education</option>
                  <option value="Information Technology">
                    Information Technology
                  </option>
                  <option value="Library">Library</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="designation"
                  className="block text-sm font-medium text-gray-700"
                >
                  Designation <span className="text-red-500">*</span>
                </label>
                <select
                  name="designation"
                  id="designation"
                  required
                  className="mt-1 block w-full py-2 px-3 rounded-md border border-gray-300 outline-none focus:border-blue-500 focus:ring-blue-500"
                  value={formData.designation}
                  onChange={handleChange}
                >
                  <option value="">Select a designation</option>
                  <option value="Principal">Principal</option>
                  <option value="Vice Principal">Vice Principal</option>
                  <option value="Head of Department">Head of Department</option>
                  <option value="Senior Teacher">Senior Teacher</option>
                  <option value="Teacher">Teacher</option>
                  <option value="Assistant Teacher">Assistant Teacher</option>
                  <option value="Librarian">Librarian</option>
                  <option value="Administrator">Administrator</option>
                  <option value="Counselor">Counselor</option>
                  <option value="Secretary">Secretary</option>
                  <option value="Janitor">Janitor</option>
                  <option value="IT Specialist">IT Specialist</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="joining_date"
                  className="block text-sm font-medium text-gray-700"
                >
                  Joining Date
                </label>
                <input
                  type="date"
                  name="joining_date"
                  id="joining_date"
                  className="mt-1 block w-full py-2 px-3 rounded-md border border-gray-300 outline-none focus:border-blue-500 focus:ring-blue-500"
                  value={formData.joining_date}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label
                  htmlFor="salary"
                  className="block text-sm font-medium text-gray-700"
                >
                  Salary
                </label>
                <input
                  type="number"
                  name="salary"
                  id="salary"
                  className="mt-1 block w-full py-2 px-3 rounded-md border border-gray-300 outline-none focus:border-blue-500 focus:ring-blue-500"
                  value={formData.salary}
                  onChange={handleChange}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  id="is_active"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={formData.is_active}
                  onChange={handleChange}
                />
                <label
                  htmlFor="is_active"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Active Staff Member
                </label>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Staff View Modal Component
function StaffViewModal({ isOpen, onClose, staff }) {
  const [activeTab, setActiveTab] = useState("profile");
  const [salaryData, setSalaryData] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { instituteState } = useContext(InstituteContext);

  useEffect(() => {
    if (isOpen && activeTab === "salary") {
      fetchSalaryData();
    } else if (isOpen && activeTab === "attendance") {
      fetchAttendanceData();
    }
  }, [isOpen, activeTab]);

  const fetchSalaryData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("salaries")
        .select("*")
        .eq("staff_id", staff.id)
        .eq("institute_id", instituteState.id)
        .order("payment_date", { ascending: false });

      if (error) throw error;
      setSalaryData(data || []);
    } catch (error) {
      console.error("Error fetching salary data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttendanceData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("staff_attendances")
        .select("*")
        .eq("staff_id", staff.id)
        .eq("institute_id", instituteState.id)
        .order("attendance_date", { ascending: false });

      if (error) throw error;
      setAttendanceData(data || []);
    } catch (error) {
      console.error("Error fetching attendance data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/25 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Staff Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("profile")}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === "profile"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <User className="inline-block mr-2" size={16} />
              Profile
            </button>
            <button
              onClick={() => setActiveTab("classes")}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === "classes"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <BookOpen className="inline-block mr-2" size={16} />
              Classes
            </button>
            <button
              onClick={() => setActiveTab("salary")}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === "salary"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <DollarSign className="inline-block mr-2" size={16} />
              Salary
            </button>
            <button
              onClick={() => setActiveTab("attendance")}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === "attendance"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Calendar className="inline-block mr-2" size={16} />
              Attendance
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {activeTab === "profile" && (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Personal Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">
                          Name
                        </label>
                        <p className="mt-1 text-sm text-gray-900">
                          {staff.name}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">
                          Email
                        </label>
                        <p className="mt-1 text-sm text-gray-900">
                          {staff.email}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">
                          Phone
                        </label>
                        <p className="mt-1 text-sm text-gray-900">
                          {staff.phone}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">
                          Address
                        </label>
                        <p className="mt-1 text-sm text-gray-900">
                          {staff.address || "Not provided"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Professional Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">
                          Department
                        </label>
                        <p className="mt-1 text-sm text-gray-900">
                          {staff.department}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">
                          Designation
                        </label>
                        <p className="mt-1 text-sm text-gray-900">
                          {staff.designation}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">
                          Joining Date
                        </label>
                        <p className="mt-1 text-sm text-gray-900">
                          {staff.joining_date
                            ? new Date(staff.joining_date).toLocaleDateString()
                            : "Not provided"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">
                          Status
                        </label>
                        <p className="mt-1 text-sm text-gray-900">
                          {staff.is_active ? "Active" : "Inactive"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "classes" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Assigned Classes
                  </h3>
                  {/* Dummy data for classes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        name: "Mathematics 101",
                        grade: "Grade 10",
                        schedule: "Mon, Wed, Fri - 9:00 AM",
                        students: 25,
                      },
                      {
                        name: "Advanced Calculus",
                        grade: "Grade 12",
                        schedule: "Tue, Thu - 11:00 AM",
                        students: 18,
                      },
                    ].map((class_, index) => (
                      <div
                        key={index}
                        className="bg-white border rounded-lg p-4 shadow-sm"
                      >
                        <h4 className="font-medium text-gray-900">
                          {class_.name}
                        </h4>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-500">
                            Grade: {class_.grade}
                          </p>
                          <p className="text-sm text-gray-500">
                            Schedule: {class_.schedule}
                          </p>
                          <p className="text-sm text-gray-500">
                            Students: {class_.students}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "salary" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Salary History
                  </h3>
                  {salaryData.length === 0 ? (
                    <p className="text-gray-500">No salary records found</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Month
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Year
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Payment Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {salaryData.map((salary) => (
                            <tr key={salary.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {salary.month}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {salary.year}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                ${salary.amount}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(
                                  salary.payment_date
                                ).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    salary.status === "paid"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {salary.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "attendance" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Attendance Record
                  </h3>
                  {attendanceData.length === 0 ? (
                    <p className="text-gray-500">No attendance records found</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Recorded At
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {attendanceData.map((record) => (
                            <tr key={record.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(
                                  record.attendance_date
                                ).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    record.status === "present"
                                      ? "bg-green-100 text-green-800"
                                      : record.status === "absent"
                                      ? "bg-red-100 text-red-800"
                                      : record.status === "half_day"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {record.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(record.recorded_at).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
