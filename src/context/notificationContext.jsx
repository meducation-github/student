import { createContext, useContext, useEffect, useState, useCallback } from "react";
import PropTypes from "prop-types";
import { supabase } from "../config/env";
import { toast } from "react-hot-toast";

const NotificationContext = createContext(null);

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
  const [userId, setUserId] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

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
        console.error("Error fetching unread notifications:", error);
      }
    };

    fetchUnreadCount();

    const channel = supabase
      .channel(`notifications_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          setUnreadCount((prev) => prev + 1);
          const message = payload?.new?.message;
          if (message && window.location.pathname !== "/notifications") {
            toast.success(message, {
              duration: 5000,
              style: {
                background: "#0f172a",
                color: "#fff",
              },
              iconTheme: {
                primary: "#2563eb",
                secondary: "#ffffff",
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
          if (!payload?.old?.viewed && payload?.new?.viewed) {
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
          if (!payload?.old?.viewed) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const setUser = useCallback((user) => {
    setUserId(user?.id ?? null);
  }, []);

  const updateUnreadCount = useCallback((count) => {
    setUnreadCount(count);
  }, []);

  const markAllAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return (
    <NotificationContext.Provider
      value={{ unreadCount, setUser, updateUnreadCount, markAllAsRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
