import React, { useState, useEffect, useContext } from "react";
import {
  Calendar,
  Edit,
  Trash2,
  Eye,
  Search,
  Plus,
  X,
  Save,
  AlertCircle,
} from "lucide-react";
import { format, addMonths, parseISO } from "date-fns";
import { supabase } from "../../../config/env";
import { InstituteContext } from "../../../context/contexts";

export default function Sessions() {
  const { instituteState } = useContext(InstituteContext);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create', 'edit', 'view'
  const [searchTerm, setSearchTerm] = useState("");
  const [currentSession, setCurrentSession] = useState({
    name: "",
    institute_id: instituteState?.id,
    start_date: "",
    end_date: "",
    is_active: false,
    description: "",
  });

  // Fetch sessions from Supabase
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("institute_id", instituteState?.id)
        .order("start_date", { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (err) {
      setError(`Error fetching sessions: ${err.message}`);
      console.error("Error fetching sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter sessions based on search term
  const filteredSessions = sessions.filter(
    (session) =>
      session.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Open modal for creating a new session
  const openCreateModal = () => {
    setCurrentSession({
      name: "",
      institute_id: instituteState?.id,
      start_date: format(new Date(), "yyyy-MM-dd"),
      end_date: format(addMonths(new Date(), 12), "yyyy-MM-dd"),
      is_active: false,
      description: "",
    });
    setModalMode("create");
    setShowModal(true);
  };

  // Open modal for viewing session details
  const openViewModal = (session) => {
    setCurrentSession(session);
    setModalMode("view");
    setShowModal(true);
  };

  // Open modal for editing a session
  const openEditModal = (session) => {
    setCurrentSession(session);
    setModalMode("edit");
    setShowModal(true);
  };

  // Handle input changes in the form
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentSession((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Calculate end date based on start date
  const calculateEndDate = (startDate) => {
    try {
      const date = parseISO(startDate);
      return format(addMonths(date, 12), "yyyy-MM-dd");
    } catch (err) {
      return "";
    }
  };

  // Handle start date change to automatically update end date
  const handleStartDateChange = (e) => {
    const startDate = e.target.value;
    setCurrentSession((prev) => ({
      ...prev,
      start_date: startDate,
      end_date: calculateEndDate(startDate),
    }));
  };

  // Save session (create or update)
  const saveSession = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      if (modalMode === "create") {
        // Create a new session
        const { data, error } = await supabase
          .from("sessions")
          .insert([currentSession])
          .select();

        if (error) throw error;
        setSessions((prev) => [...prev, data[0]]);
      } else if (modalMode === "edit") {
        // Update existing session
        const { data, error } = await supabase
          .from("sessions")
          .update({
            name: currentSession.name,
            start_date: currentSession.start_date,
            end_date: currentSession.end_date,
            is_active: currentSession.is_active,
            description: currentSession.description,
          })
          .eq("id", currentSession.id)
          .select();

        if (error) throw error;

        setSessions((prev) =>
          prev.map((session) =>
            session.id === currentSession.id ? data[0] : session
          )
        );
      }

      setShowModal(false);
    } catch (err) {
      setError(`Error saving session: ${err.message}`);
      console.error("Error saving session:", err);
    } finally {
      setLoading(false);
    }
  };

  // Delete a session
  const deleteSession = async (id) => {
    if (!window.confirm("Are you sure you want to delete this session?"))
      return;

    try {
      setLoading(true);
      const { error } = await supabase.from("sessions").delete().eq("id", id);

      if (error) throw error;

      setSessions(sessions.filter((session) => session.id !== id));
    } catch (err) {
      setError(`Error deleting session: ${err.message}`);
      console.error("Error deleting session:", err);
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch (err) {
      return dateString;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Academic Sessions</h1>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 flex items-center">
          <AlertCircle className="mr-2" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="flex flex-wrap justify-between items-center mb-6">
        <div className="relative flex items-center mb-4 mx-3 md:mb-0 w-full md:w-auto">
          <Search className="absolute left-3 text-gray-500" />
          <input
            type="text"
            placeholder="Search sessions..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full md:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center transition-colors"
        >
          <Plus className="mr-1 h-5 w-5" />
          Create New Session
        </button>
      </div>

      {loading && !sessions.length ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sessions...</p>
        </div>
      ) : !filteredSessions.length ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-2" />
          <h3 className="text-lg font-medium text-gray-800">
            No sessions found
          </h3>
          <p className="text-gray-600">
            {searchTerm
              ? "No sessions match your search"
              : "Create your first academic session"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSessions.map((session) => (
                <tr
                  key={session.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => openViewModal(session)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                      {session.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                    {formatDate(session.start_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                    {formatDate(session.end_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        session.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {session.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700 truncate max-w-xs">
                    {session.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div
                      className="flex justify-end space-x-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openViewModal(session);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 transition-colors"
                        title="View details"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(session);
                        }}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        title="Edit session"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(session.id);
                        }}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="Delete session"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for Create, Edit, View */}
      {showModal && (
        <div className="fixed inset-0 bg-black/25 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md mx-auto overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {modalMode === "create"
                  ? "Create New Session"
                  : modalMode === "edit"
                  ? "Edit Session"
                  : "Session Details"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={saveSession}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Session Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={currentSession.name}
                    onChange={handleInputChange}
                    disabled={modalMode === "view"}
                    placeholder="e.g., Academic Year 2025-2026"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    value={currentSession.start_date}
                    onChange={handleStartDateChange}
                    disabled={modalMode === "view"}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date (12 months from start date)
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    value={currentSession.end_date}
                    disabled={true} // Always disabled as it's calculated automatically
                    className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                    required
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={currentSession.is_active}
                    onChange={handleInputChange}
                    disabled={modalMode === "view"}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="is_active"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Set as active session
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={currentSession.description}
                    onChange={handleInputChange}
                    disabled={modalMode === "view"}
                    placeholder="Add additional details about this session..."
                    rows="3"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 p-6 border-t border-gray-200 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {modalMode === "view" ? "Close" : "Cancel"}
                </button>

                {modalMode !== "view" && (
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
                    disabled={loading}
                  >
                    <Save className="mr-1 h-4 w-4" />
                    {loading ? "Saving..." : "Save Session"}
                  </button>
                )}

                {modalMode === "view" && (
                  <button
                    type="button"
                    onClick={() => {
                      setModalMode("edit");
                    }}
                    className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
                  >
                    <Edit className="mr-1 h-4 w-4" />
                    Edit
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
