import React, { useState, useEffect } from 'react';
import api, { apiErrorMessage } from '../../redux/api';

function DevotionsList() {
  const [devotions, setDevotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/api/v1/devotions')
      .then((response) => {
        setDevotions(response.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(apiErrorMessage(err, 'Failed to load devotions.'));
        setLoading(false);
        console.error(err);
      });
  }, []);

  if (loading) return <p className="loading-message">Loading devotions...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div>
      <h2>Devotions</h2>
      <p>{devotions.length} devotion(s) found.</p>

      {devotions.length === 0 ? (
        <p>No devotions created yet.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Date</th>
              <th>Created By</th>
            </tr>
          </thead>
          <tbody>
            {devotions.map((devotion) => (
              <tr key={devotion.id}>
                <td>{devotion.id}</td>
                <td>{devotion.title || '-'}</td>
                <td>{devotion.date || devotion.created_at || '-'}</td>
                <td>{devotion.created_by_id || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default DevotionsList;
