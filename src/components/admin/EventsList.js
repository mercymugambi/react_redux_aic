import React, { useState, useEffect } from 'react';
import api from '../../redux/api';

function EventsList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/api/v1/events')
      .then((response) => {
        setEvents(response.data);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to load events.');
        setLoading(false);
        console.error(err);
      });
  }, []);

  if (loading) return <p className="loading-message">Loading events...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div>
      <h2>Events</h2>
      <p>{events.length} event(s) found.</p>

      {events.length === 0 ? (
        <p>No events created yet.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Date</th>
              <th>Location</th>
              <th>Created By</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id}>
                <td>{event.id}</td>
                <td>{event.title || event.name || '-'}</td>
                <td>{event.date || event.event_date || '-'}</td>
                <td>{event.location || '-'}</td>
                <td>{event.created_by_id || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default EventsList;
