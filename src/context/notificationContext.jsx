import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../config/env";
import { toast } from "react-hot-toast";

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState(null);

  // Set up real-time subscription for notifications
  useEffect(() => {
    if (!userId) return;

    // Fetch initial unread count
    const fetchUnreadCount = async () => {
      try {
        const { count, error } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("receiver_id", userId)
          .eq("viewed", false);

        if (error) throw error;
        setUnreadCount(count || 0);
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };

    fetchUnreadCount();

    // Subscribe to real-time changes
    const channel = supabase
      .channel("global_notifications_channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          console.log("New notification received:", payload);
          const newNotification = payload.new;

          // Update unread count
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
              onClick: () => {
                // Navigate to notifications page when toast is clicked
                window.location.href = "/notifications";
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
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          console.log("Notification updated:", payload);
          // Update unread count if notification was marked as read
          if (payload.new.viewed && !payload.old.viewed) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "notifications",
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          console.log("Notification deleted:", payload);
          // Update unread count if deleted notification was unread
          if (!payload.old.viewed) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const setUser = (user) => {
    setUserId(user?.id || null);
  };

  const updateUnreadCount = (count) => {
    setUnreadCount(count);
  };

  const markAllAsRead = async () => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ viewed: true })
        .eq("receiver_id", userId)
        .eq("viewed", false);

      if (error) throw error;
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const value = {
    unreadCount,
    setUser,
    updateUnreadCount,
    markAllAsRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
