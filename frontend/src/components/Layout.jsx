import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import ChatAssistant from './ChatAssistant';
import './Layout.css';

import { Menu, X } from 'lucide-react';

const Layout = () => {
    const [isSidebarOpen, setSidebarOpen] = React.useState(false);

    return (
        <div className="app-container">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="mobile-overlay"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <main className="main-content">
                <div className="top-bar">
                    <button
                        className="mobile-menu-btn"
                        onClick={() => setSidebarOpen(!isSidebarOpen)}
                    >
                        <Menu size={24} />
                    </button>
                    {/* Date/Header content moved to center or kept right */}
                    <div style={{ flex: 1 }}></div>
                </div>

                <div className="content-area">
                    <Outlet />
                </div>
            </main>
            <ChatAssistant />
        </div>
    );
};

export default Layout;
