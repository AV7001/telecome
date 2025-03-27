import { supabase } from '../lib/supabase';
import { messaging, getToken, onMessage } from '../lib/firebase';
import toast from 'react-hot-toast';

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

class NotificationService {
  private static async sendSingleNotification(token: string, payload: NotificationPayload) {
    try {
      const response = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `key=${import.meta.env.VITE_FIREBASE_SERVER_KEY}`,
        },
        body: JSON.stringify({
          to: token,
          notification: {
            title: payload.title,
            body: payload.body,
          },
          data: payload.data,
        }),
      });

      if (!response.ok) {
        throw new Error(`FCM send failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error sending to token ${token}:`, error);
      throw error;
    }
  }

  static notify(message: string, type: 'success' | 'error' = 'success') {
    if (type === 'success') {
      toast.success(message);
    } else {
      toast.error(message);
    }
  }

  static async requestPermission(): Promise<string | null> {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
        });
        return token;
      }
      return null;
    } catch (error) {
      console.error('FCM permission error:', error);
      return null;
    }
  }

  static async sendAdminNotification(payload: NotificationPayload) {
    try {
      const { data: admins, error } = await supabase
        .from('user_profiles')
        .select('id, fcm_token')
        .eq('role', 'admin');

      if (error || !admins?.length) {
        this.notify('No admin users found', 'error');
        return;
      }

      const notifications = admins
        .filter(admin => admin.fcm_token)
        .map(admin => this.sendSingleNotification(admin.fcm_token!, payload));

      await Promise.all(notifications);
      this.notify('Notification sent to admins');
    } catch (error) {
      this.notify('Failed to send notification', 'error');
      console.error('Error:', error);
    }
  }

  static subscribeToNotifications(callback: (payload: any) => void) {
    return onMessage(messaging, (payload) => {
      callback(payload);
    });
  }
}

export default NotificationService;