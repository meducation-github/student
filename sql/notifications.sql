-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sender_id uuid NULL,
  receiver_id uuid NOT NULL,
  message text NOT NULL,
  viewed boolean NULL DEFAULT false,
  source text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES auth.users (id),
  CONSTRAINT notifications_sender_id_fkey1 FOREIGN KEY (sender_id) REFERENCES institutes (id)
) TABLESPACE pg_default;

-- Enable Row Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Users can only see their own notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = receiver_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = receiver_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = receiver_id);

-- Institutes can insert notifications for their students
CREATE POLICY "Institutes can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (
    sender_id IN (
      SELECT id FROM institutes WHERE user_id = auth.uid()
    )
  );

-- Enable real-time for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_receiver_id ON public.notifications(receiver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_viewed ON public.notifications(viewed);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Create a function to automatically mark notifications as read when viewed
CREATE OR REPLACE FUNCTION mark_notification_as_read(notification_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.notifications 
  SET viewed = true 
  WHERE id = notification_id AND receiver_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION mark_notification_as_read(uuid) TO authenticated;

-- Create a function to get unread count for a user
CREATE OR REPLACE FUNCTION get_unread_notifications_count()
RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer 
    FROM public.notifications 
    WHERE receiver_id = auth.uid() AND viewed = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_unread_notifications_count() TO authenticated;
