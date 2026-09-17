import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../redux/authSlice';
import api from '../../redux/api';

function DashboardHome() {
  const user = useSelector(selectCurrentUser);
  const [stats, setStats] = useState({
    members: 0,
    users: 0,
    events: 0,
    devotions: 0,
    fellowshipGroups: 0,
    leadershipPositions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [members, users, events, devotions, groups, positions] = await Promise.all([
          api.get('/api/v1/members').catch(() => ({ data: [] })),
          api.get('/api/v1/users').catch(() => ({ data: [] })),
          api.get('/api/v1/events').catch(() => ({ data: [] })),
          api.get('/api/v1/devotions').catch(() => ({ data: [] })),
          api.get('/api/v1/fellowship_groups').catch(() => ({ data: [] })),
          api.get('/api/v1/leadership_positions').catch(() => ({ data: [] })),
        ]);

        setStats({
          members: members.data.length,
          users: users.data.length,
          events: events.data.length,
          devotions: devotions.data.length,
          fellowshipGroups: groups.data.length,
          leadershipPositions: positions.data.length,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <h2>Dashboard</h2>
      <p>
        Welcome back, <strong>{user?.firstname} {user?.lastname}</strong> ({user?.email})
      </p>
      <p>
        Role: {user?.super_admin ? 'Super Admin' : (user?.roles || []).join(', ') || 'No roles assigned'}
      </p>

      {loading ? (
        <p className="loading-message">Loading stats...</p>
      ) : (
        <div className="summary-cards">
          <div className="summary-card">
            <h4>Members</h4>
            <div className="count">{stats.members}</div>
          </div>
          <div className="summary-card">
            <h4>Users</h4>
            <div className="count">{stats.users}</div>
          </div>
          <div className="summary-card">
            <h4>Events</h4>
            <div className="count">{stats.events}</div>
          </div>
          <div className="summary-card">
            <h4>Devotions</h4>
            <div className="count">{stats.devotions}</div>
          </div>
          <div className="summary-card">
            <h4>Fellowship Groups</h4>
            <div className="count">{stats.fellowshipGroups}</div>
          </div>
          <div className="summary-card">
            <h4>Leadership Positions</h4>
            <div className="count">{stats.leadershipPositions}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardHome;
