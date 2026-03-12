import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  metadata: Record<string, any>;
  read: boolean;
  created_at: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiUrl}/notifications`, {
        withCredentials: true,
      });
      const items = response.data.notifications || [];
      setNotifications(items);
      setUnreadCount(items.filter((n: Notification) => !n.read).length);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    await axios.patch(
      `${apiUrl}/notifications/${id}/read`,
      {},
      { withCredentials: true }
    );
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  return { notifications, loading, unreadCount, refetch: fetchNotifications, markAsRead };
}
