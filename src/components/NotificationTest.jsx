import { useState } from "react";
import { supabase } from "../config/env";
import { useContext } from "react";
import { UserContext } from "../context/contexts";
import { toast } from "react-hot-toast";

const NotificationTest = () => {
  const { authState } = useContext(UserContext);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const sendTestNotification = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("notifications").insert({
        receiver_id: authState.id,
        message: message,
        source: "Test",
        sender_id: null, // System notification
      });

      if (error) throw error;

      toast.success("Test notification sent!");
      setMessage("");
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("Failed to send notification");
    } finally {
      setLoading(false);
    }
  };

  if (!authState?.id) {
    return null;
  }

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold mb-3">Test Notifications</h3>
      <p className="text-sm text-gray-600 mb-3">
        Send a test notification. It will be automatically marked as read after
        5 seconds on the notifications page.
      </p>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter test message..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={sendTestNotification}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Sending..." : "Send Test Notification"}
        </button>
      </div>
    </div>
  );
};

export default NotificationTest;
