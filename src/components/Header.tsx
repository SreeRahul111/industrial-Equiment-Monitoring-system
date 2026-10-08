import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  Shield,
  Activity,
  LogOut,
  Bell,
  Menu,
  X,
  Server,
  Layers,
  AlertTriangle,
  Sliders,
  Calendar,
  Lock,
  UserCheck
} from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'US';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const navItems = [
    { name: 'Overview', path: '/overview', icon: <Layers size={16} /> },
    { name: 'Machines', path: '/machines', icon: <Activity size={16} /> },
    { name: 'Alerts', path: '/alerts', icon: <AlertTriangle size={16} /> },
    { name: 'Thresholds', path: '/thresholds', icon: <Sliders size={16} /> },
    { name: 'Maintenance', path: '/maintenance', icon: <Calendar size={16} /> },
    { name: 'Audit', path: '/audit', icon: <Lock size={16} /> },
    ...(hasRole('ADMIN')
      ? [{ name: 'Admin', path: '/admin', icon: <UserCheck size={16} /> }]
      : []),
    { name: 'System Health', path: '/health', icon: <Server size={16} /> },
  ];

  return (
    <header
      style={{
        backgroundColor: '#0F172A',
        color: '#F8FAFC',
        borderBottom: '1px solid #1E293B',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '0 24px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Left: Brand & Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <div
            onClick={() => navigate('/overview')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '17px',
              letterSpacing: '-0.02em',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
              }}
            >
              <Shield size={18} />
            </div>
            <span>
              IEMS <span style={{ color: '#64748B', fontWeight: 400 }}>• Control</span>
            </span>
          </div>

          {/* Desktop Navigation links */}
          <nav
            style={{
              display: 'none',
              gap: '4px',
              alignItems: 'center',
            }}
            className="desktop-nav"
          >
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 500,
                  textDecoration: 'none',
                  color: isActive ? '#FFFFFF' : '#94A3B8',
                  backgroundColor: isActive ? '#1E293B' : 'transparent',
                  transition: 'all 0.15s ease',
                })}
              >
                {item.icon}
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right: Status, User, Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Live Indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '3px 10px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#10B981',
              letterSpacing: '0.05em',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
              }}
              className="pulse-indicator"
            />
            LIVE
          </div>

          {/* User Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ textAlign: 'right', display: 'none' }} className="user-text-meta">
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#F8FAFC' }}>
                {user?.name}
              </div>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color: user?.role === 'ADMIN' ? '#A78BFA' : user?.role === 'ENGINEER' ? '#60A5FA' : '#94A3B8',
                  letterSpacing: '0.04em',
                }}
              >
                {user?.role}
              </div>
            </div>

            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: '#334155',
                border: '1px solid #475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 700,
                color: '#F8FAFC',
                letterSpacing: '0.05em',
              }}
              title={`${user?.name} (${user?.email}) - ${user?.role}`}
            >
              {getInitials(user?.name)}
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: '1px solid #334155',
              color: '#94A3B8',
              borderRadius: '8px',
              padding: '6px 10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 500,
              transition: 'all 0.15s ease',
            }}
            title="Secure Logout"
          >
            <LogOut size={14} />
            <span className="logout-text">Logout</span>
          </button>

          {/* Mobile hamburger toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#F8FAFC',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '6px',
            }}
            className="mobile-menu-toggle"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            backgroundColor: '#0F172A',
            borderTop: '1px solid #1E293B',
            padding: '12px 24px 20px',
          }}
        >
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 500,
                  textDecoration: 'none',
                  color: isActive ? '#FFFFFF' : '#94A3B8',
                  backgroundColor: isActive ? '#1E293B' : 'transparent',
                })}
              >
                {item.icon}
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      )}

      <style>{`
        @media (min-width: 900px) {
          .desktop-nav {
            display: flex !important;
          }
          .mobile-menu-toggle {
            display: none !important;
          }
          .user-text-meta {
            display: block !important;
          }
        }
      `}</style>
    </header>
  );
};
