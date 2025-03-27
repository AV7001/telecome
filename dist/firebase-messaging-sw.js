importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDKm7L8RzH9vzww7nF_RLbY6IZE-RUcKLQ',
  authDomain: 'telecom-8ca2b.firebaseapp.com',
  projectId: 'telecom-8ca2b',
  messagingSenderId: '112634171139267539898',
  appId: '1:112634171139267539898:web:your_app_id'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/firebase-logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});