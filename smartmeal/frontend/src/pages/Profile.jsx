import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

function Profile() {
  const { user } = useContext(AuthContext);

  return (
    <div className="profile-content">
      <h2>My Profile</h2>
      <div style={{ padding: '1rem 0' }}>
         <p><strong>Name:</strong> {user?.name}</p>
         <p><strong>Email:</strong> {user?.email}</p>
      </div>
      <div style={{ marginTop: '2rem' }}>
        <Link to="/dashboard">Back to Dashboard</Link>
      </div>
    </div>
  );
}

export default Profile;
