import { useState, useEffect, useContext } from "react";
import {
  Building2,
  Utensils,
  Library,
  MonitorPlay,
  Dumbbell,
  Car,
  Tablets,
  Waves,
  Trees,
  Armchair,
  BookOpenText,
  ParkingSquare,
  Pencil,
  Trash2,
  Plus,
  X,
  FileBarChart,
  Building,
  LucideCirclePlus,
} from "lucide-react";
import { supabase } from "../../../config/env";
import { InstituteContext } from "../../../context/contexts";

// Default facility icons mapping
const facilityIcons = {
  classroom: <Building2 size={24} />,
  cafeteria: <Utensils size={24} />,
  library: <Library size={24} />,
  computer_lab: <MonitorPlay size={24} />,
  gym: <Dumbbell size={24} />,
  parking: <Car size={24} />,
  medical_center: <Tablets size={24} />,
  swimming_pool: <Waves size={24} />,
  garden: <Trees size={24} />,
  auditorium: <Armchair size={24} />,
  study_room: <BookOpenText size={24} />,
  parking_lot: <ParkingSquare size={24} />,
  admin_office: <FileBarChart size={24} />,
  // Default icon for custom facilities
  custom: <Building size={24} />,
};

// Default facilities data
const defaultFacilities = [
  {
    id: "classroom",
    name: "Classroom",
    icon: "classroom",
    description:
      "Standard teaching rooms equipped with desks, chairs, and presentation equipment.",
  },
  {
    id: "cafeteria",
    name: "Cafeteria",
    icon: "cafeteria",
    description: "Food service area with seating for students and staff.",
  },
  {
    id: "library",
    name: "Library",
    icon: "library",
    description: "Collection of books, resources, and study spaces.",
  },
  {
    id: "computer_lab",
    name: "Computer Lab",
    icon: "computer_lab",
    description:
      "Room equipped with computers for technology classes and student use.",
  },
  {
    id: "gym",
    name: "Gymnasium",
    icon: "gym",
    description: "Indoor space for sports and physical education activities.",
  },
  {
    id: "parking",
    name: "Parking",
    icon: "parking",
    description: "Designated areas for vehicle parking.",
  },
  {
    id: "medical_center",
    name: "Medical Center",
    icon: "medical_center",
    description:
      "Healthcare facility for emergency and routine medical services.",
  },
  {
    id: "swimming_pool",
    name: "Swimming Pool",
    icon: "swimming_pool",
    description: "Facility for aquatic activities and swimming lessons.",
  },
  {
    id: "garden",
    name: "Garden",
    icon: "garden",
    description:
      "Outdoor area with plants and seating for relaxation and nature study.",
  },
  {
    id: "auditorium",
    name: "Auditorium",
    icon: "auditorium",
    description: "Large venue for presentations, performances, and assemblies.",
  },
  {
    id: "study_room",
    name: "Study Room",
    icon: "study_room",
    description: "Quiet spaces designated for individual or group study.",
  },
  {
    id: "parking_lot",
    name: "Parking Lot",
    icon: "parking_lot",
    description: "Large area for multiple vehicles with designated spaces.",
  },
  {
    id: "admin_office",
    name: "Administrative Office",
    icon: "admin_office",
    description: "Offices for administrative staff and management.",
  },
];

export default function Facilities() {
  const { instituteState } = useContext(InstituteContext);
  const [facilities, setFacilities] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states for custom facility
  const [customName, setCustomName] = useState("");
  const [customDescription, setCustomDescription] = useState("");

  useEffect(() => {
    fetchFacilities();
  }, [instituteState?.id]);

  const fetchFacilities = async () => {
    if (!instituteState?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("facilities")
        .select("*")
        .eq("institute_id", instituteState.id);

      if (error) throw error;

      setFacilities(data || []);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching facilities:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFacility = async (facilityId) => {
    if (!instituteState?.id) return;

    try {
      const defaultFacility = defaultFacilities.find(
        (f) => f.id === facilityId
      );
      if (!defaultFacility) return;

      const { error } = await supabase.from("facilities").insert([
        {
          institute_id: instituteState.id,
          name: defaultFacility.name,
          icon: defaultFacility.icon,
          description: defaultFacility.description,
          is_default: true,
          default_id: defaultFacility.id,
        },
      ]);

      if (error) throw error;

      // Refresh facilities list
      fetchFacilities();
      setShowAddModal(false);
    } catch (err) {
      setError(err.message);
      console.error("Error adding facility:", err);
    }
  };

  const handleAddCustomFacility = async () => {
    if (!instituteState?.id || !customName.trim()) return;

    try {
      const { error } = await supabase.from("facilities").insert([
        {
          institute_id: instituteState.id,
          name: customName.trim(),
          icon: "custom",
          description: customDescription.trim(),
          is_default: false,
        },
      ]);

      if (error) throw error;

      // Refresh facilities list and reset form
      fetchFacilities();
      setCustomName("");
      setCustomDescription("");
      setShowCustomModal(false);
    } catch (err) {
      setError(err.message);
      console.error("Error adding custom facility:", err);
    }
  };

  const handleDeleteFacility = async (id) => {
    if (!instituteState?.id) return;

    try {
      const { error } = await supabase
        .from("facilities")
        .delete()
        .eq("id", id)
        .eq("institute_id", instituteState.id);

      if (error) throw error;

      // Refresh facilities list
      fetchFacilities();
    } catch (err) {
      setError(err.message);
      console.error("Error deleting facility:", err);
    }
  };

  const handleViewFacility = (facility) => {
    setSelectedFacility(facility);
    setShowViewModal(true);
  };

  const alreadyAddedDefaultIds = facilities
    .filter((f) => f.is_default)
    .map((f) => f.default_id);

  const availableDefaultFacilities = defaultFacilities.filter(
    (f) => !alreadyAddedDefaultIds.includes(f.id)
  );

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Facilities Management
        </h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <p className="text-gray-500">Loading facilities...</p>
        </div>
      ) : facilities.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6 text-center">
          <p className="text-gray-700">
            No facilities added yet. Add your first facility using the buttons
            above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
            <div
              className="p-4 cursor-pointer"
              onClick={() => setShowAddModal(true)}
            >
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-blue-50 rounded-full text-blue-500">
                <LucideCirclePlus />
              </div>
              <h3 className="text-lg font-semibold text-center text-gray-800 mb-1">
                Add Facility
              </h3>
            </div>
            <div className="border-t border-gray-100 bg-gray-50 p-2 flex justify-end space-x-1"></div>
          </div>
          {facilities.map((facility) => (
            <div
              key={facility.id}
              className="bg-white rounded-lg overflow-hidden border border-gray-200"
            >
              <div
                className="p-4 cursor-pointer"
                onClick={() => handleViewFacility(facility)}
              >
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-blue-50 rounded-full text-blue-500">
                  {facilityIcons[facility.icon]}
                </div>
                <h3 className="text-lg font-semibold text-center text-gray-800 mb-1">
                  {facility.name}
                </h3>
              </div>
              {/* <div className="border-t border-gray-100 bg-gray-50 p-2 flex justify-end space-x-1">
                <button
                  className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-200"
                  title="Edit"
                  onClick={() => handleEditFacility(facility.id)}
                >
                  <Pencil size={16} />
                </button>
                <button
                  className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-gray-200"
                  title="Delete"
                  onClick={() => handleDeleteFacility(facility.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div> */}
            </div>
          ))}
        </div>
      )}

      {/* Add Default Facility Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/25 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">
                Add Facility
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              {availableDefaultFacilities.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  All default facilities have been added.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    className="border border-gray-200 rounded-md p-4 flex items-start hover:bg-gray-50 cursor-pointer"
                    onClick={() => setShowCustomModal(true)}
                  >
                    <div className="flex-shrink-0 mr-3 text-blue-500">
                      <LucideCirclePlus />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">
                        Add Custom Facility
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Add a custom facility to the institute.
                      </p>
                    </div>
                  </div>
                  {availableDefaultFacilities.map((facility) => (
                    <div
                      key={facility.id}
                      className="border border-gray-200 rounded-md p-4 flex items-start hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleAddFacility(facility.id)}
                    >
                      <div className="flex-shrink-0 mr-3 text-blue-500">
                        {facilityIcons[facility.icon]}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800">
                          {facility.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {facility.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowAddModal(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Facility Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">
                Add Custom Facility
              </h2>
              <button
                onClick={() => setShowCustomModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="name"
                >
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Facility name"
                />
              </div>
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="description"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="Describe the facility"
                />
              </div>
              <div className="flex justify-center items-center mb-4">
                <div className="bg-blue-50 p-4 rounded-full text-blue-500">
                  {facilityIcons.custom}
                </div>
                <p className="ml-2 text-sm text-gray-500">
                  Default icon for custom facilities
                </p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
              <button
                onClick={() => setShowCustomModal(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomFacility}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
                disabled={!customName.trim()}
              >
                Add Facility
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Facility Modal */}
      {showViewModal && selectedFacility && (
        <div className="fixed inset-0 bg-black/25 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">
                Facility Details
              </h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                  {facilityIcons[selectedFacility.icon]}
                </div>
              </div>
              <h3 className="text-xl font-bold text-center mb-4">
                {selectedFacility.name}
              </h3>
              <p className="text-gray-700 text-center">
                {selectedFacility.description}
              </p>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => handleDeleteFacility(selectedFacility.id)}
                className="bg-red-500 mr-2 hover:bg-red-600 text-white px-4 text-sm py-1 rounded-md"
              >
                Delete
              </button>
              <button
                onClick={() => setShowViewModal(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
