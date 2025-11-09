import { useState, useEffect, useRef } from "react";
import {
  Eye,
  Pencil,
  Trash,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Plus,
  Save,
  Check,
  AlertTriangle,
  Users,
} from "lucide-react";
import { supabase } from "../../config/env";
import PageHeader from "../../components/pageHeader";

// Constants
const INSTITUTE_ID = "550e8400-e29b-41d4-a716-446655440000";
const PAGE_SIZE = 10;

export default function Parents() {
  // State variables
  const [parents, setParents] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentParent, setCurrentParent] = useState(null);
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  // Form state
  const initialFormState = {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    occupation: "",
    relationship: "Parent",
    student_ids: "",
    institute_id: INSTITUTE_ID,
  };
  const [formData, setFormData] = useState(initialFormState);

  // Load parents and students from database
  useEffect(() => {
    fetchParents();
    fetchStudents();
  }, [page, searchTerm]);

  const fetchParents = async () => {
    setLoading(true);
    try {
      let query = supabase.from("parents").select("*", { count: "exact" });

      // Apply search filter if search term exists
      if (searchTerm) {
        query = query.or(
          `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
        );
      }

      // Apply pagination
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const {
        data,
        error,
        count: totalCount,
      } = await query.range(from, to).order("created_at", { ascending: false });

      if (error) throw error;

      setParents(data || []);
      setCount(totalCount || 0);
    } catch (err) {
      setError("Failed to fetch parents");
      console.error("Error fetching parents:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("id, first_name, last_name")
        .eq("institute_id", INSTITUTE_ID)
        .order("first_name", { ascending: true });

      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error("Error fetching students:", err);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Add new parent
  const handleAddParent = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("parents")
        .insert([formData])
        .select();

      if (error) throw error;

      setParents([data[0], ...parents]);
      setShowAddModal(false);
      setFormData(initialFormState);
      fetchParents(); // Refresh the list
    } catch (err) {
      setError("Failed to add parent");
      console.error("Error adding parent:", err);
    } finally {
      setLoading(false);
    }
  };

  // Update parent
  const handleUpdateParent = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("parents")
        .update(formData)
        .eq("id", currentParent.id)
        .select();

      if (error) throw error;

      // Update the parent in the local state
      setParents(parents.map((p) => (p.id === currentParent.id ? data[0] : p)));
      setShowEditModal(false);
      setCurrentParent(null);
      fetchParents(); // Refresh the list
    } catch (err) {
      setError("Failed to update parent");
      console.error("Error updating parent:", err);
    } finally {
      setLoading(false);
    }
  };

  // Delete parent
  const handleDeleteParent = async (id) => {
    if (!window.confirm("Are you sure you want to delete this parent?")) {
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("parents").delete().eq("id", id);

      if (error) throw error;

      // Remove the parent from the local state
      setParents(parents.filter((p) => p.id !== id));
      fetchParents(); // Refresh the list
    } catch (err) {
      setError("Failed to delete parent");
      console.error("Error deleting parent:", err);
    } finally {
      setLoading(false);
    }
  };

  // Open edit modal
  const openEditModal = (parent) => {
    setCurrentParent(parent);
    setFormData({ ...parent });
    setShowEditModal(true);
  };

  // Open view modal
  const openViewModal = (parent) => {
    setCurrentParent(parent);
    setShowViewModal(true);
  };

  // Get student names from IDs
  const getStudentNames = (studentIds) => {
    if (!studentIds) return "None";

    const ids = studentIds.split(",").map((id) => id.trim());
    const studentNames = students
      .filter((student) => ids.includes(student.id))
      .map((student) => `${student.first_name} ${student.last_name}`);

    return studentNames.length ? studentNames.join(", ") : "None";
  };

  // Reset form data
  const resetForm = () => {
    setFormData(initialFormState);
  };

  // Pagination
  const totalPages = Math.ceil(count / PAGE_SIZE);

  const nextPage = () => {
    if (page < totalPages - 1) {
      setPage(page + 1);
    }
  };

  const prevPage = () => {
    if (page > 0) {
      setPage(page - 1);
    }
  };

  return (
    <div>
      <PageHeader title={"Parents"} subtitle={`Manage your parents.`} />

      {/* Main Content */}
      <main className="py-4">
        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5" />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-700 hover:text-red-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Parents Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search parents by name or email..."
                className="pl-10 pr-4 text-sm py-2 border border-gray-300 outline-none bg-white rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="ml-auto">
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-white text-blue-600 px-4 py-2 rounded-md flex items-center font-medium hover:bg-blue-50 transition-colors"
              >
                <Plus className="mr-1 h-5 w-5" />
                Add Parent
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading parents...</p>
            </div>
          ) : parents.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">
                No parents found. Add a new parent to get started.
              </p>
            </div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Occupation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Relationship
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Students
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {parents.map((parent) => (
                    <tr
                      key={parent.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => openViewModal(parent)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {parent.first_name} {parent.last_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {/* <div className="text-sm text-gray-900">
                          {parent.email}
                        </div> */}
                        <div className="text-sm text-gray-500">
                          {parent.phone || "No phone"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {parent.occupation || "Not specified"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {parent.relationship}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {getStudentNames(parent.student_ids)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Showing {page * PAGE_SIZE + 1} to{" "}
                  {Math.min((page + 1) * PAGE_SIZE, count)} of {count} parents
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={prevPage}
                    disabled={page === 0}
                    className={`px-3 py-1 rounded-md ${
                      page === 0
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={nextPage}
                    disabled={page >= totalPages - 1}
                    className={`px-3 py-1 rounded-md ${
                      page >= totalPages - 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Add Parent Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/25 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Add New Parent
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddParent} className="px-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  ></textarea>
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Occupation
                  </label>
                  <input
                    type="text"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship
                  </label>
                  <select
                    name="relationship"
                    value={formData.relationship}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Parent">Parent</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Students
                  </label>
                  <StudentMultiSelect
                    students={students}
                    selectedIds={formData.student_ids}
                    onChange={(value) =>
                      setFormData({ ...formData, student_ids: value })
                    }
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Select students to associate with this parent
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Parent
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Parent Modal */}
      {showEditModal && currentParent && (
        <div className="fixed inset-0 bg-black/25 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Edit Parent
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setCurrentParent(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateParent} className="px-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  ></textarea>
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Occupation
                  </label>
                  <input
                    type="text"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship
                  </label>
                  <select
                    name="relationship"
                    value={formData.relationship}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Parent">Parent</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Students
                  </label>
                  <StudentMultiSelect
                    students={students}
                    selectedIds={formData.student_ids}
                    onChange={(value) =>
                      setFormData({ ...formData, student_ids: value })
                    }
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setCurrentParent(null);
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Update Parent
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Parent Modal */}
      {showViewModal && currentParent && (
        <div className="fixed inset-0 bg-black/25 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Parent Details
              </h3>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setCurrentParent(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-4">
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="col-span-1 text-sm font-medium text-gray-500">
                  Full Name
                </div>
                <div className="col-span-3 text-sm text-gray-900">
                  {currentParent.first_name} {currentParent.last_name}
                </div>

                <div className="col-span-1 text-sm font-medium text-gray-500">
                  Email
                </div>
                <div className="col-span-3 text-sm text-gray-900">
                  {currentParent.email}
                </div>

                <div className="col-span-1 text-sm font-medium text-gray-500">
                  Phone
                </div>
                <div className="col-span-3 text-sm text-gray-900">
                  {currentParent.phone || "Not provided"}
                </div>

                <div className="col-span-1 text-sm font-medium text-gray-500">
                  Address
                </div>
                <div className="col-span-3 text-sm text-gray-900">
                  {currentParent.address || "Not provided"}
                </div>

                <div className="col-span-1 text-sm font-medium text-gray-500">
                  Occupation
                </div>
                <div className="col-span-3 text-sm text-gray-900">
                  {currentParent.occupation || "Not provided"}
                </div>

                <div className="col-span-1 text-sm font-medium text-gray-500">
                  Relationship
                </div>
                <div className="col-span-3 text-sm text-gray-900">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    {currentParent.relationship}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mt-2">
                <div className="text-sm font-medium text-gray-500 mb-2">
                  Associated Students
                </div>
                {currentParent.student_ids ? (
                  <div className="bg-gray-50 rounded-md p-3">
                    {getStudentNames(currentParent.student_ids)
                      .split(", ")
                      .map((name, index) => (
                        <div key={index} className="flex items-center py-1">
                          <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3">
                            {name.charAt(0)}
                          </div>
                          <span className="text-sm text-gray-900">{name}</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    No students associated with this parent
                  </p>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setCurrentParent(null);
                }}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  openEditModal(currentParent);
                }}
                className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 flex items-center"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </button>
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      "Are you sure you want to delete this parent?"
                    )
                  ) {
                    handleDeleteParent(currentParent.id);
                    setShowViewModal(false);
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Add this new component before the Parents component
function StudentMultiSelect({ students, selectedIds, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter students based on search term
  const filteredStudents = students.filter(
    (student) =>
      student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.last_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected student names
  const selectedStudents = students.filter((student) =>
    selectedIds.split(",").includes(student.id)
  );

  const handleSelect = (studentId) => {
    const currentIds = selectedIds ? selectedIds.split(",") : [];
    const newIds = currentIds.includes(studentId)
      ? currentIds.filter((id) => id !== studentId)
      : [...currentIds, studentId];
    onChange(newIds.join(","));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1">
          {selectedStudents.length > 0 ? (
            selectedStudents.map((student) => (
              <span
                key={student.id}
                className="inline-flex items-center px-2 py-1 rounded-md text-sm bg-blue-100 text-blue-700"
              >
                {student.first_name} {student.last_name}
                <button
                  type="button"
                  className="ml-1 text-blue-500 hover:text-blue-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(student.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))
          ) : (
            <span className="text-gray-500">Select students...</span>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="py-1">
            {filteredStudents.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                No students found
              </div>
            ) : (
              filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                    selectedIds.split(",").includes(student.id)
                      ? "bg-blue-50"
                      : ""
                  }`}
                  onClick={() => handleSelect(student.id)}
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={selectedIds.split(",").includes(student.id)}
                      onChange={() => {}}
                    />
                    <span>
                      {student.first_name} {student.last_name}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
