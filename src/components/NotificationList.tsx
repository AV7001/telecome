import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { XCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

export function NotificationList() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        toast.error('Failed to load notifications');
      } else {
        setNotifications(data || []);
      }
      setLoading(false);
    };

    fetchNotifications();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, fetchNotifications)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      if (error) throw error;

      setNotifications((prev) =>
        prev.map((notification) => (notification.id === id ? { ...notification, is_read: true } : notification))
      );

      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;

      setNotifications((prev) => prev.filter((notification) => notification.id !== id));
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete notification');
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading notifications...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Notifications</h2>

      {notifications.length === 0 ? (
        <p className="text-gray-500 text-center">No notifications available</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {notifications.map((notification) => (
            <li key={notification.id} className="py-3 flex justify-between items-center">
              <div>
                <p className={`text-sm ${notification.is_read ? 'text-gray-500' : 'text-gray-900 font-semibold'}`}>
                  {notification.message}
                </p>
                <p className="text-xs text-gray-400">{new Date(notification.created_at).toLocaleString()}</p>
              </div>
              <div className="flex space-x-3">
                {!notification.is_read && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="text-green-600 hover:text-green-900 flex items-center"
                  >
                    <CheckCircle className="w-5 h-5 mr-1" /> Read
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(notification.id)}
                  className="text-red-600 hover:text-red-900 flex items-center"
                >
                  <XCircle className="w-5 h-5 mr-1" /> Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default NotificationList;
