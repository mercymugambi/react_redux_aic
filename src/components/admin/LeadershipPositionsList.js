import React, { useState, useEffect } from 'react';
import api, { apiErrorMessage } from '../../redux/api';

function LeadershipPositionsList() {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/api/v1/leadership_positions')
      .then((response) => {
        setPositions(response.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(apiErrorMessage(err, 'Failed to load leadership positions.'));
        setLoading(false);
        console.error(err);
      });
  }, []);

  if (loading) return <p className="loading-message">Loading leadership positions...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div>
      <h2>Leadership Positions</h2>
      <p>{positions.length} position(s) found.</p>

      {positions.length === 0 ? (
        <p>No leadership positions created yet.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Position Code</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((position) => (
              <tr key={position.id}>
                <td>{position.id}</td>
                <td>{position.title || position.name || '-'}</td>
                <td>{position.position_code || '-'}</td>
                <td>{position.description || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default LeadershipPositionsList;
