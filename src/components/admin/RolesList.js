import React, { useState, useEffect } from 'react';
import api, { apiErrorMessage } from '../../redux/api';

function RolesList() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/api/v1/roles')
      .then((response) => {
        setRoles(response.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(apiErrorMessage(err, 'Failed to load roles.'));
        setLoading(false);
        console.error(err);
      });
  }, []);

  if (loading) return <p className="loading-message">Loading roles...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div>
      <h2>Roles</h2>
      <p>{roles.length} role(s) found.</p>

      {roles.length === 0 ? (
        <p>No roles defined yet.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Description</th>
              <th>Permissions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.id}>
                <td>{role.id}</td>
                <td>{role.name}</td>
                <td>{role.description || '-'}</td>
                <td>
                  {(role.permissions || []).map((p) => p.name).join(', ') || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default RolesList;
