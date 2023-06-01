import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Home() {
  const [text, setText] = useState('');
  const [userId, setUserId] = useState('');

  const resetUser = () => {
    // Remove current user.
    localStorage.removeItem('userId');
    setUserId('');

    // Create new user in Fictioneers.
    getOrAddUserId();
  };

  const getOrAddUserId = async () => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      // Get user ID from Fictioneers.
      const response = await axios.get(`/api/user/${userId}`),
      resUserId = response.data.user;


      // Set the ID in state.
      setUserId(resUserId);

    } else {
      // Create user in Fictioneers.
      const response = await axios.post('/api/user'),
      resUserId = response.data.user;


      // Set the ID in local storage.
      localStorage.setItem('userId', resUserId);

      // Set the ID in state.
      setUserId(resUserId);
    }
  };

  useEffect(() => {
    getOrAddUserId();

    const fetchData = async () => {
      const response = await axios.post('/api/text');
      console.log(response.data)
      setText(response.data.text.text);
    };
    fetchData();
  }, []);

  return (
    <div>
      <p>{text}</p>
      <p>{userId}</p>
      <button onClick={resetUser}>Reset User</button>
    </div>
  );
}
