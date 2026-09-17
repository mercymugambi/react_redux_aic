import React, { useState, useEffect } from 'react';
import api from '../../redux/api';

function MembersList() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/api/v1/members')
      .then((response) => {
        setMembers(response.data);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to load members.');
        setLoading(false);
        console.error(err);
      });
  }, []);

  if (loading) return <p className="loading-message">Loading members...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div>
      <h2>Members</h2>
      <p>{members.length} member(s) found.</p>

      {members.length === 0 ? (
        <p>No members registered yet.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Phone</th>
              <th>Date of Birth</th>
              <th>Residence</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id}>
                <td>{member.id}</td>
                <td>{member.first_name}</td>
                <td>{member.last_name}</td>
                <td>{member.phone_number}</td>
                <td>{member.date_of_birth || '-'}</td>
                <td>{member.place_of_residence || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default MembersList;
