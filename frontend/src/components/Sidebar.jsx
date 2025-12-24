import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Database, Activity, FileText, Settings } from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const navItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/data-entry', label: 'Data Entry', icon: <Database size={20} /> },
    { path: '/predictions', label: 'Health & Yield', icon: <Activity size={20} /> },
    { path: '/reports', label: 'Reports', icon: <FileText size={20} /> },
  ];

  return (
    <aside className="sidebar">


      <div className="sidebar-header">
        <img src="/calf-logo.png" alt="Calf AI Logo" className="logo-image" />
        <h1 className="brand-name">Calf AI</h1>
      </div>





      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ padding: '0 1rem 1rem', color: 'var(--text-light)', fontSize: '0.8rem', textAlign: 'center' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
        <div className="user-profile">
          <div className="avatar">D</div>
          <div className="user-info">
            <span className="user-name">Dhruv Farmer</span>
            <span className="user-role">Farm Owner</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
