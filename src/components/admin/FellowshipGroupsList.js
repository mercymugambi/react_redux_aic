import React, { useState, useEffect } from 'react';
import api from '../../redux/api';

function FellowshipGroupsList() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/api/v1/fellowship_groups')
      .then((response) => {
        setGroups(response.data);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to load fellowship groups.');
        setLoading(false);
        console.error(err);
      });
  }, []);

  if (loading) return <p className="loading-message">Loading fellowship groups...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div>
      <h2>Fellowship Groups</h2>
      <p>{groups.length} group(s) found.</p>

      {groups.length === 0 ? (
        <p>No fellowship groups created yet.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Group Code</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <tr key={group.id}>
                <td>{group.id}</td>
                <td>{group.name}</td>
                <td>{group.group_code || '-'}</td>
                <td>{group.description || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default FellowshipGroupsList;
