import React, { useState, useEffect, useContext } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Edit,
  Trash2,
  Plus,
  X,
  Save,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { InstituteContext } from "../../../context/contexts";
import { supabase } from "../../../config/env";

const Events = () => {
  const { instituteState } = useContext(InstituteContext);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState({
    name: "",
    description: "",
    date: "",
    time: "",
    location: "",
    institute_id: instituteState?.id || null,
  });
  const [isEditing, setIsEditing] = useState(false);

  // Fetch events data
  useEffect(() => {
    fetchEvents();
  }, [instituteState?.id]);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("institute_id", instituteState?.id)
        .order("date", { ascending: true });

      if (error) throw error;
      setEvents(data);
    } catch (err) {
      setError("Failed to fetch events");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentEvent((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const eventData = {
        ...currentEvent,
        institute_id: instituteState.id,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("events")
          .update(eventData)
          .eq("id", currentEvent.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("events").insert([eventData]);

        if (error) throw error;
      }

      // Add a small delay to show the loading state
      setTimeout(() => {
        setIsModalOpen(false);
        setCurrentEvent({
          name: "",
          description: "",
          date: "",
          time: "",
          location: "",
          institute_id: instituteState?.id || null,
        });
        setIsSubmitting(false);
        fetchEvents();
      }, 1000);
    } catch (err) {
      console.error("Error saving event:", err);
      setError("Failed to save event");
      setIsSubmitting(false);
    }
  };

  const handleEdit = (event) => {
    setCurrentEvent(event);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        const { error } = await supabase.from("events").delete().eq("id", id);

        if (error) throw error;
        fetchEvents();
      } catch (err) {
        console.error("Error deleting event:", err);
        setError("Failed to delete event");
      }
    }
  };

  const formatDate = (dateString) => {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );

  if (error)
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>{error}</p>
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold ">Events Management</h1>
        <button
          onClick={() => {
            setIsEditing(false);
            setCurrentEvent({
              name: "",
              description: "",
              date: "",
              time: "",
              location: "",
              institute_id: instituteState?.id || null,
            });
            setIsModalOpen(true);
          }}
          className="flex items-center bg-blue-100 hover:bg-blue-200 text-blue-600 px-4 py-2 rounded-md transition duration-300"
        >
          <Plus size={18} className="mr-2" />
          Add New Event
        </button>
      </div>

      {/* Events List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.length > 0 ? (
          events.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-lg overflow-hidden border border-gray-200"
            >
              <div className="p-5">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {event.name}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {event.description}
                </p>

                <div className="flex items-center text-gray-500 mb-2">
                  <Calendar size={16} className="mr-2" />
                  <span>{formatDate(event.date)}</span>
                </div>

                <div className="flex items-center text-gray-500 mb-2">
                  <Clock size={16} className="mr-2" />
                  <span>{event.time}</span>
                </div>

                <div className="flex items-center text-gray-500 mb-4">
                  <MapPin size={16} className="mr-2" />
                  <span>{event.location}</span>
                </div>

                <div className="flex justify-end space-x-2 mt-3">
                  <button
                    onClick={() => handleEdit(event)}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition duration-300"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-full transition duration-300"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <div className="text-gray-400 mb-3">
              <Calendar size={48} />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-1">
              No events found
            </h3>
            <p className="text-gray-500 text-center mb-4">
              Get started by creating your first event
            </p>
            <button
              onClick={() => {
                setIsEditing(false);
                setCurrentEvent({
                  name: "",
                  description: "",
                  date: "",
                  time: "",
                  location: "",
                  institute_id: instituteState?.id || null,
                });
                setIsModalOpen(true);
              }}
              className="flex items-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition duration-300"
            >
              <Plus size={18} className="mr-2" />
              Add New Event
            </button>
          </div>
        )}
      </div>

      {/* Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/25 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-200 p-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {isEditing ? "Edit Event" : "Create New Event"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="col-span-2">
                  <label
                    className="block text-gray-700 font-medium mb-2"
                    htmlFor="name"
                  >
                    Event Name*
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={currentEvent.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label
                    className="block text-gray-700 font-medium mb-2"
                    htmlFor="description"
                  >
                    Description*
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={currentEvent.description}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>

                <div>
                  <label
                    className="block text-gray-700 font-medium mb-2"
                    htmlFor="date"
                  >
                    Date*
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={currentEvent.date}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    className="block text-gray-700 font-medium mb-2"
                    htmlFor="time"
                  >
                    Time*
                  </label>
                  <input
                    type="time"
                    id="time"
                    name="time"
                    value={currentEvent.time}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label
                    className="block text-gray-700 font-medium mb-2"
                    htmlFor="location"
                  >
                    Location*
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={currentEvent.location}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition duration-300"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-300 flex items-center disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                      {isEditing ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      <Save size={18} className="mr-2" />
                      {isEditing ? "Update Event" : "Create Event"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
