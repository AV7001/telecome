import { messaging } from './firebaseAdmin';
import { supabase } from './supabase';

export async function sendNotificationToAdmins(title: string, body: string) {
  try {
    // Get admin FCM tokens
    const { data: admins, error } = await supabase
      .from('profiles')
      .select('fcm_token')
      .eq('role', 'admin');

    if (error) throw error;

    const tokens = admins
      .map((admin) => admin.fcm_token)
      .filter((token): token is string => Boolean(token));

    if (tokens.length === 0) return;

    // Create the message payload
    const message = {
      notification: {
        title,
        body,
      },
      data: {
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        sound: 'default',
      },
    };

    // Send to each token individually since sendMulticast isn't available
    const notifications = tokens.map(token => 
      messaging.send({
        ...message,
        token, // Single token instead of tokens array
      })
    );

    // Wait for all notifications to be sent
    await Promise.all(notifications);

  } catch (error) {
    console.error('Error sending notification:', error);
    throw error; // Re-throw to handle in calling code
  }
}