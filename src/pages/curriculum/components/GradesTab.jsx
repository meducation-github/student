import { useContext, useEffect, useState } from "react";
import {
  Pencil,
  Trash2,
  Plus,
  GraduationCap,
  Eye,
  X,
  Save,
  AlertCircle,
  Check,
} from "lucide-react";
import { supabase } from "../../../config/env";
import { InstituteContext } from "../../../context/contexts";

const STUDENT_ID = localStorage.getItem("student_id");

export default function GradesTab({ showNotification }) {
  const { instituteState } = useContext(InstituteContext);
  const [grades, setGrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  // Form states
  const [currentGrade, setCurrentGrade] = useState({
    name: "",
    level: "",
    description: "",
  });
  const [deleteItem, setDeleteItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchGrades();
  }, []);

  // Fetch grades from Supabase
  const fetchGrades = async () => {
    setIsLoading(true);
    try {
      // get grade_id from students table
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("grade")
        .eq("id", STUDENT_ID);

      console.log(studentData);

      if (studentError) throw studentError;

      const { data, error } = await supabase
        .from("grades")
        .select("*")
        .eq("id", studentData[0].grade);

      if (error) throw error;
      setGrades(data || []);
    } catch (error) {
      setError("Failed to fetch grades: " + error.message);
      console.error("Error fetching grades:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Create or update grade
  const handleSaveGrade = async () => {
    try {
      // Validate grade level
      if (currentGrade.level === "") {
        showNotification("Grade level cannot be empty", "error");
        return;
      }

      // Check if grade level already exists
      if (!isEditing) {
        const gradeExists = grades.some(
          (grade) =>
            grade.level.toLowerCase() === currentGrade.level.toLowerCase() &&
            grade.id !== currentGrade.id
        );

        if (gradeExists) {
          showNotification("This grade already exists", "error");
          return;
        }
      }

      if (isEditing) {
        // Update existing grade
        const { error } = await supabase
          .from("grades")
          .update({
            name: currentGrade.name,
            level: currentGrade.level,
            description: currentGrade.description,
          })
          .eq("id", currentGrade.id);

        if (error) throw error;
        showNotification("Grade updated successfully", "success");
      } else {
        // Create new grade
        const { error } = await supabase.from("grades").insert([
          {
            name: currentGrade.name,
            level: currentGrade.level,
            description: currentGrade.description,
            institute_id: instituteState.id,
          },
        ]);

        if (error) throw error;
        showNotification("Grade created successfully", "success");
      }

      // Refresh grades data and close modal
      setShowGradeModal(false);
      fetchGrades();
    } catch (error) {
      showNotification("Error saving grade: " + error.message, "error");
      console.error("Error saving grade:", error);
    }
  };

  // Delete grade
  const handleDelete = async () => {
    try {
      if (!deleteItem) return;

      const { id } = deleteItem;

      // Check if grade has subjects
      const { data, error } = await supabase
        .from("subjects")
        .select("id")
        .eq("grade_id", id);

      if (error) throw error;

      if (data && data.length > 0) {
        showNotification(
          "Cannot delete grade with associated subjects",
          "error"
        );
        setShowDeleteModal(false);
        return;
      }

      const { error: deleteError } = await supabase
        .from("grades")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      showNotification("Grade deleted successfully", "success");
      fetchGrades();
      setShowDeleteModal(false);
    } catch (error) {
      showNotification("Error during deletion: " + error.message, "error");
      console.error("Error during deletion:", error);
    }
  };

  // Open the add grade modal
  const openAddGradeModal = () => {
    setCurrentGrade({ name: "", level: "", description: "" });
    setIsEditing(false);
    setShowGradeModal(true);
  };

  // Open the edit grade modal
  const openEditGradeModal = (grade) => {
    setCurrentGrade({ ...grade });
    setIsEditing(true);
    setShowGradeModal(true);
  };

  // Open the delete confirmation modal
  const openDeleteModal = (id) => {
    setDeleteItem({ id });
    setShowDeleteModal(true);
  };

  // Open the view details modal
  const openViewModal = (grade) => {
    setViewItem({ ...grade, type: "grade" });
    setShowViewModal(true);
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {grades.length === 0 ? (
        <div className="text-center py-12 px-4">
          <GraduationCap size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            No grades found
          </h3>
          <p className="text-gray-500 mb-6">
            Get started by adding your first grade
          </p>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center mx-auto text-sm transition-colors"
            onClick={openAddGradeModal}
          >
            <Plus size={16} className="mr-2" />
            Add Grade
          </button>
        </div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Grade Level
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {grades.map((grade) => (
              <tr key={grade.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {grade.level}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {grade.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs">
                  {grade.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      className="text-indigo-600 hover:text-indigo-900 p-1"
                      onClick={() => openViewModal(grade)}
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className="text-blue-600 hover:text-blue-900 p-1"
                      onClick={() => openEditGradeModal(grade)}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="text-red-600 hover:text-red-900 p-1"
                      onClick={() => openDeleteModal(grade.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Grade Modal */}
      {showGradeModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-black/25"></div>
            </div>
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {isEditing ? "Edit Grade" : "Add New Grade"}
                </h3>
                <button
                  className="text-gray-400 hover:text-gray-500"
                  onClick={() => setShowGradeModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="mt-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grade Level
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. 1, 2, KG"
                    value={currentGrade.level || ""}
                    onChange={(e) =>
                      setCurrentGrade({
                        ...currentGrade,
                        level: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grade Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. First Grade, Second Grade"
                    value={currentGrade.name || ""}
                    onChange={(e) =>
                      setCurrentGrade({ ...currentGrade, name: e.target.value })
                    }
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="Add description of this grade"
                    value={currentGrade.description || ""}
                    onChange={(e) =>
                      setCurrentGrade({
                        ...currentGrade,
                        description: e.target.value,
                      })
                    }
                  ></textarea>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 focus:outline-none"
                  onClick={() => setShowGradeModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none flex items-center"
                  onClick={handleSaveGrade}
                >
                  <Save size={16} className="mr-2" />
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block w-full max-w-sm p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Confirm Deletion
                </h3>
                <button
                  className="text-gray-400 hover:text-gray-500"
                  onClick={() => setShowDeleteModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this grade? This action cannot
                  be undone.
                </p>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 focus:outline-none"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none flex items-center"
                  onClick={handleDelete}
                >
                  <Trash2 size={16} className="mr-2" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-black/25"></div>
            </div>
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Grade Details
                </h3>
                <button
                  className="text-gray-400 hover:text-gray-500"
                  onClick={() => setShowViewModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="mt-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Grade Level
                    </h4>
                    <p className="mt-1 text-base font-medium text-gray-900">
                      {viewItem.level}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Grade Name
                    </h4>
                    <p className="mt-1 text-base text-gray-900">
                      {viewItem.name}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Description
                    </h4>
                    <p className="mt-1 text-base text-gray-900">
                      {viewItem.description || "No description provided"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Institute ID
                    </h4>
                    <p className="mt-1 text-sm text-gray-500">
                      {viewItem.institute_id}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 focus:outline-none"
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </button>
                <button
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none flex items-center"
                  onClick={() => {
                    setShowViewModal(false);
                    openEditGradeModal(viewItem);
                  }}
                >
                  <Pencil size={16} className="mr-2" />
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
