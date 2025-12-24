import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import DataEntry from './pages/DataEntry';
import Predictions from './pages/Predictions';
import Reports from './pages/Reports';

// Simple placeholder for pages not yet built
const NotFound = () => <div style={{ padding: '2rem' }}>Page not found</div>;


const PageTitleUpdater = () => {
  const location = window.location.pathname;

  React.useEffect(() => {
    const titles = {
      '/': 'Dashboard',
      '/data-entry': 'Data Entry',
      '/predictions': 'Health Predictions',
      '/reports': 'Reports'
    };
    const title = titles[location] || 'Monitoring';
    document.title = `Calf AI - ${title}`;
  }, [location]);

  return null;
};

function App() {
  return (
    <Router>
      <PageTitleUpdater />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="data-entry" element={<DataEntry />} />
          <Route path="predictions" element={<Predictions />} />
          <Route path="reports" element={<Reports />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}


export default App;
