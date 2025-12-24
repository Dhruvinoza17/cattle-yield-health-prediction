import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Database, Activity, FileText, Settings, LogOut } from 'lucide-react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import './Sidebar.css';

import EditProfileModal from './EditProfileModal';

const Sidebar = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = React.useState('Loading...');
  const [userRole, setUserRole] = React.useState('Farm Owner'); // Dynamically could be fetched too
  const [fullUserData, setFullUserData] = React.useState(null);
  const [dateTime, setDateTime] = React.useState(new Date());
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  React.useEffect(() => {
    // 1. Live Clock
    const timer = setInterval(() => setDateTime(new Date()), 1000);

    // 2. Fetch User Profile
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setFullUserData(data);
            setUserName(data.fullName || 'Farmer');
            setUserRole(data.farmName || 'Farm Owner');
          } else {
            setUserName(user.displayName || 'Farmer');
            setFullUserData({ email: user.email }); // Fallback
          }
        } catch (e) {
          console.error("Error fetching user:", e);
        }
      } else {
        setUserName("Guest");
      }
    });

    return () => {
      clearInterval(timer);
      unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/'); // Redirect to Landing Page
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/data-entry', label: 'Data Entry', icon: <Database size={20} /> },
    { path: '/predictions', label: 'My Herd', icon: <Activity size={20} /> },
    { path: '/reports', label: 'Reports', icon: <FileText size={20} /> },
  ];

  // Numeric Date Format: DD/MM/YYYY HH:mm AM/PM
  const formattedDate = dateTime.toLocaleString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    hour12: true
  }).toUpperCase();

  return (
    <>
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
          <div style={{ padding: '0 1rem 1rem', color: 'var(--text-light)', fontSize: '0.85rem', textAlign: 'center', fontFamily: 'monospace' }}>
            {formattedDate}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingRight: '1rem' }}>
            {/* Clickable Profile Section */}
            <div className="user-profile" onClick={() => setIsModalOpen(true)} style={{ cursor: 'pointer', flex: 1 }}>
              <div className="avatar">{userName.charAt(0).toUpperCase()}</div>
              <div className="user-info">
                <span className="user-name">{userName}</span>
                <span className="user-role">{userRole}</span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              title="Log Out"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#8d6e63', // Matches theme
                padding: '0.5rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fee2e2'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#8d6e63'; e.currentTarget.style.background = 'none'; }}
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </aside>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentUserData={fullUserData}
      />
    </>
  );
};

export default Sidebar;
