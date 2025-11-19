import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../../config/env";
import { UserContext } from "../../context/contexts";
import { useNotifications } from "../../context/notificationContext";
import {
  LucideBell,
  LucideClock,
  LucideTrash2,
  LucideUser,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { toast } from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import { cn } from "../../lib/utils/cn";

const Notifications = () => {
  const { authState } = useContext(UserContext);
  const { markAllAsRead, updateUnreadCount } = useNotifications();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [displayLimit, setDisplayLimit] = useState(6);

  const unreadTotal = useMemo(
    () => notifications.filter((notification) => !notification.viewed).length,
    [notifications]
  );

  const fetchNotifications = useCallback(async () => {
    if (!authState?.id) return;
    setLoading(true);
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

    if (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Unable to load notifications");
      setLoading(false);
      return;
    }

    setNotifications(data || []);
    updateUnreadCount(
      data?.filter((notification) => !notification.viewed).length || 0
    );
    setLoading(false);
  }, [authState?.id, updateUnreadCount]);

  const handleDeleteNotification = async (notificationId) => {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (error) {
      console.error("Error deleting notification:", error);
      toast.error("Unable to delete notification");
      return;
    }

    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== notificationId)
    );
    toast.success("Notification deleted");
  };

  const handleMarkAllAsRead = useCallback(async () => {
    if (!authState?.id) return;
    const { error } = await supabase
      .from("notifications")
      .update({ viewed: true })
      .eq("receiver_id", authState.id)
      .eq("viewed", false);

    if (error) {
      console.error("Error marking as read:", error);
      return;
    }

    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, viewed: true }))
    );
    markAllAsRead();
  }, [authState?.id, markAllAsRead]);

  useEffect(() => {
    if (!authState?.id) return;

    fetchNotifications();

    const channel = supabase
      .channel(`notifications_feed_${authState.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `receiver_id=eq.${authState.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
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
          setNotifications((prev) =>
            prev.map((notification) =>
              notification.id === payload.new.id
                ? { ...notification, ...payload.new }
                : notification
            )
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
          setNotifications((prev) =>
            prev.filter((notification) => notification.id !== payload.old.id)
          );
        }
        )
        .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authState?.id, fetchNotifications]);

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border bg-white/80 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Notifications
            </p>
            <h1 className="text-3xl font-bold text-foreground">
              Updates from your institute
            </h1>
            <p className="text-sm text-muted-foreground">
              Stay on top of attendance, fee reminders and study alerts.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={unreadTotal === 0}
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
            <Button
              variant="ghost"
              disabled={notifications.length <= displayLimit}
              onClick={() => setDisplayLimit((prev) => prev + 4)}
            >
              Load older
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className="h-28 animate-pulse rounded-2xl border bg-white/50"
            />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <LucideBell className="h-5 w-5" />
              Nothing new yet
            </CardTitle>
            <CardDescription>
              Your institute will send attendance, fee and study reminders here.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.slice(0, displayLimit).map((notification) => (
            <Card
              key={notification.id}
              className={cn(
                "transition-all",
                notification.viewed ? "" : "border-primary/40 bg-primary/5"
              )}
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <LucideBell className="h-4 w-4 text-primary" />
                    <span>
                      {notification.institutes?.name || "MEducation System"}
                    </span>
                    <span>•</span>
                    <LucideClock className="h-3.5 w-3.5" />
                    <span>
                      {formatDistanceToNow(
                        new Date(notification.created_at),
                        {
                          addSuffix: true,
                        }
                      )}
                    </span>
                    {notification.source && (
                      <Badge variant="secondary">{notification.source}</Badge>
                    )}
                  </div>
                  <CardTitle className="mt-2 text-lg">
                    {notification.title || "Institute notification"}
                  </CardTitle>
                  <CardDescription className="mt-2 text-base text-foreground">
                    {notification.message}
                  </CardDescription>
                </div>
                {!notification.viewed && (
                  <Badge className="self-start">New</Badge>
                )}
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LucideUser className="h-4 w-4" />
                  {notification.sender_name || "Institute team"}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => handleDeleteNotification(notification.id)}
                >
                  <LucideTrash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
};

export default Notifications;
