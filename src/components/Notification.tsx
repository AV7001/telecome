import React, { useState, useEffect } from 'react';

const Notification: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {

  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose();
    }, 5000); // Notification will disappear after 5 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!visible) return null;

  return (
    <div className="notification">
      <p>{message}</p>
      <button onClick={() => setVisible(false)}>Close</button>
    </div>
  );
};

export default Notification;
