import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export interface Notification {
  id: string;
  message: string;
  created_at: string;
  read: boolean;
  user_email: string;
  site_name: string;
  action_type: string;
}

interface BasicNotificationParams {
  userEmail: string;
  siteName: string;
  changes: string;
  actionType: string;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  createNotification: (params: BasicNotificationParams) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    set({ loading: true });

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch notifications');
      console.error(error);
    } else {
      set({ 
        notifications: data || [],
        unreadCount: data?.filter(n => !n.read).length || 0,
        loading: false
      });
    }
  },

  markAsRead: async (id) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);

    if (error) {
      toast.error('Failed to mark notification as read');
      return;
    }

    set(state => ({
      notifications: state.notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1)
    }));
  },

  createNotification: async ({ userEmail, siteName, changes, actionType }: BasicNotificationParams) => {
    const message = `${userEmail} ${actionType} site: ${siteName}. Changes: ${changes}`;

    const { error } = await supabase
      .from('notifications')
      .insert([{
        message,
        user_email: userEmail,
        site_name: siteName,
        action_type: actionType,
        read: false,
        created_at: new Date().toISOString(),
      }]);

    if (error) {
      toast.error('Failed to create notification');
      console.error(error);
    } else {
      toast.success(`New notification: ${message}`);
      await get().fetchNotifications();
    }
  }
}));
