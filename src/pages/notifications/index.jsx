import { useState, useEffect, useContext } from "react";
import { supabase } from "../../config/env";
import { UserContext } from "../../context/contexts";
import { useNotifications } from "../../context/notificationContext";
import { toast, Toaster } from "react-hot-toast";
import {
  LucideBell,
  LucideTrash2,
  LucideClock,
  LucideUser,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const Notifications = () => {
  const { authState } = useContext(UserContext);
  const { markAllAsRead: markAllAsReadContext } = useNotifications();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [displayLimit, setDisplayLimit] = useState(5);
  const [hasMore, setHasMore] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!authState?.id) return;

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select(
          `
          *,
          institutes:institutes(name)
        `
        )
        .eq("receiver_id", authState.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter((n) => !n.viewed).length || 0);
      setHasMore((data || []).length > 5);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  // Show more notifications
  const showMore = () => {
    setDisplayLimit((prev) => prev + 5);
  };

  // Show less notifications (back to 5)
  const showLess = () => {
    setDisplayLimit(5);
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications((prev) => {
        const updated = prev.filter((n) => n.id !== notificationId);
        setHasMore(updated.length > displayLimit);
        return updated;
      });
      setUnreadCount((prev) => {
        const deletedNotification = notifications.find(
          (n) => n.id === notificationId
        );
        return deletedNotification && !deletedNotification.viewed
          ? prev - 1
          : prev;
      });
      toast.success("Notification deleted");
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    }
  };

  // Auto-mark all notifications as read after 5 seconds on page
  const markAllAsReadAfterDelay = async () => {
    if (!authState?.id) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ viewed: true })
        .eq("receiver_id", authState.id)
        .eq("viewed", false);

      if (error) throw error;

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, viewed: true })));
      setUnreadCount(0);

      // Update global context
      markAllAsReadContext();
    } catch (error) {
      console.error("Error auto-marking notifications as read:", error);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!authState?.id) return;

    fetchNotifications();

    // Auto-mark all as read after 5 seconds on page
    const timer = setTimeout(() => {
      markAllAsReadAfterDelay();
    }, 5000);

    // Subscribe to real-time changes
    const channel = supabase
      .channel("notifications_channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `receiver_id=eq.${authState.id}`,
        },
        (payload) => {
          console.log("New notification received:", payload);
          const newNotification = payload.new;

          // Add the new notification to the list
          setNotifications((prev) => {
            const updated = [newNotification, ...prev];
            setHasMore(updated.length > displayLimit);
            return updated;
          });
          setUnreadCount((prev) => prev + 1);

          // Show toast notification if user is not on notifications page
          if (window.location.pathname !== "/notifications") {
            toast.success(newNotification.message, {
              duration: 5000,
              icon: "🔔",
              style: {
                background: "#363636",
                color: "#fff",
              },
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `receiver_id=eq.${authState.id}`,
        },
        (payload) => {
          console.log("Notification updated:", payload);
          setNotifications((prev) =>
            prev.map((n) => (n.id === payload.new.id ? payload.new : n))
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "notifications",
          filter: `receiver_id=eq.${authState.id}`,
        },
        (payload) => {
          console.log("Notification deleted:", payload);
          setNotifications((prev) => {
            const updated = prev.filter((n) => n.id !== payload.old.id);
            setHasMore(updated.length > displayLimit);
            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [authState?.id]);

  // Update hasMore when displayLimit changes
  useEffect(() => {
    setHasMore(notifications.length > displayLimit);
  }, [displayLimit, notifications.length]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-3">
          <LucideBell className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-blue-500 text-white text-sm font-bold px-3 py-1 rounded-full animate-pulse">
              {unreadCount} unread
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 ml-auto">
          All notifications are automatically marked as read after 5 seconds on
          this page
        </p>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <LucideBell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No notifications
          </h3>
          <p className="text-gray-500">
            You're all caught up! Check back later for updates.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.slice(0, displayLimit).map((notification) => (
            <div
              key={notification.id}
              className={`bg-white border rounded-lg p-4 shadow-sm transition-all hover:shadow-md ${
                !notification.viewed
                  ? "border-l-4 border-l-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-100"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {notification.sender_id && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <LucideUser className="w-4 h-4" />
                        <span>{notification.institutes?.name || "System"}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <LucideClock className="w-4 h-4" />
                      <span>
                        {formatDistanceToNow(
                          new Date(notification.created_at),
                          { addSuffix: true }
                        )}
                      </span>
                    </div>
                    {notification.source && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {notification.source}
                      </span>
                    )}
                  </div>

                  <p
                    className={`mb-3 ${
                      !notification.viewed
                        ? "text-gray-900 font-medium"
                        : "text-gray-700"
                    }`}
                  >
                    {notification.message}
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 transition-colors"
                    >
                      <LucideTrash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>

                {!notification.viewed && (
                  <div className="flex flex-col items-center gap-2 ml-4">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-blue-600 font-medium">
                      NEW
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Show More/Less Buttons */}
      {notifications.length > 5 && (
        <div className="flex justify-center mt-6">
          {hasMore ? (
            <button
              onClick={showMore}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Show More ({notifications.length - displayLimit} remaining)
            </button>
          ) : (
            <button
              onClick={showLess}
              className="flex items-center gap-2 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Show Less
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;
