import React, { useState, useEffect } from 'react';
import { Download, FileText, Filter, TrendingUp, AlertTriangle } from 'lucide-react';
import { auth, db } from '../firebase';
import { collection, getDocs, orderBy, query, onSnapshot } from 'firebase/firestore';

const Reports = () => {
    const [history, setHistory] = useState([]);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        let unsubscribe = () => { };

        const setupListener = () => {
            if (!auth.currentUser) return;

            const q = collection(db, "users", auth.currentUser.uid, "cattle_records");

            // Real-time listener for Reports
            unsubscribe = onSnapshot(q, (querySnapshot) => {
                const data = querySnapshot.docs.map(doc => {
                    const d = doc.data();
                    return {
                        id: d.Animal_ID || 'Unknown',
                        // Robust mapping
                        yield: parseFloat(d.predictedYield || d.yield || 0).toFixed(1),
                        disease: d.healthStatus || d.disease || 'N/A',
                        risk: d.riskLevel || d.risk || 'Low',
                        date: d.createdAt ? d.createdAt.toDate() : new Date(),
                        ...d
                    };
                });

                // Sort client-side to assume latest first (safer than Firestore orderBy without index)
                const sortedData = data.sort((a, b) => b.date - a.date);
                setHistory(sortedData);
            }, (error) => {
                console.error("Error fetching reports:", error);
            });
        };

        const authUnsub = auth.onAuthStateChanged((user) => {
            if (user) setupListener();
            else {
                setHistory([]);
                unsubscribe();
            }
        });

        return () => {
            authUnsub();
            unsubscribe();
        };
    }, []);

    const exportPDF = () => {
        // Simple print-to-pdf trigger
        window.print();
    };

    // calculate stats
    const totalPredictions = history.length;
    const highRiskCount = history.filter(h => h.risk === 'High').length;
    const avgYield = history.length > 0
        ? (history.reduce((acc, curr) => acc + parseFloat(curr.yield || 0), 0) / history.length).toFixed(1)
        : 0;

    return (
        <div className="reports-page">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '2rem' }}>
                <div>
                    <h2>Reports & Analytics</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Historical Analysis of AI Predictions.</p>
                </div>
                <button className="btn btn-primary" onClick={exportPDF}>
                    <Download size={18} style={{ marginRight: '0.5rem' }} /> Export Report
                </button>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Total Scans</span>
                            <div style={{ fontSize: '1.8rem', fontWeight: '700', marginTop: '0.5rem' }}>{totalPredictions}</div>
                        </div>
                        <FileText className="text-primary" />
                    </div>
                </div>
                <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #ef4444' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>High Risk Alerts</span>
                            <div style={{ fontSize: '1.8rem', fontWeight: '700', marginTop: '0.5rem', color: '#ef4444' }}>{highRiskCount}</div>
                        </div>
                        <AlertTriangle color="#ef4444" />
                    </div>
                </div>
                <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #10b981' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Avg. Yield</span>
                            <div style={{ fontSize: '1.8rem', fontWeight: '700', marginTop: '0.5rem', color: '#10b981' }}>{avgYield} L</div>
                        </div>
                        <TrendingUp color="#10b981" />
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <h3>Prediction History</h3>
                        <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem', background: 'var(--bg-main)', borderRadius: '10px' }}>
                            {history.length} records
                        </span>
                    </div>
                </div>

                {history.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <p>No predictions yet. Go to Data Entry or Predictions to generate data.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                    <th style={{ padding: '1rem', fontSize: '0.85rem' }}>DATE</th>
                                    <th style={{ padding: '1rem', fontSize: '0.85rem' }}>CATTLE ID</th>
                                    <th style={{ padding: '1rem', fontSize: '0.85rem' }}>PREDICTED YIELD</th>
                                    <th style={{ padding: '1rem', fontSize: '0.85rem' }}>DISEASE PREDICTION</th>
                                    <th style={{ padding: '1rem', fontSize: '0.85rem' }}>RISK LEVEL</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((record, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                                            {new Date(record.date).toLocaleDateString()} <small>{new Date(record.date).toLocaleTimeString()}</small>
                                        </td>
                                        <td style={{ padding: '1rem', fontWeight: '500' }}>{record.id}</td>
                                        <td style={{ padding: '1rem' }}>{record.yield} L</td>
                                        <td style={{ padding: '1rem' }}>{record.disease}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '20px',
                                                fontSize: '0.8rem',
                                                fontWeight: '500',
                                                background: record.risk === 'High' ? '#fee2e2' : '#dcfce7',
                                                color: record.risk === 'High' ? '#ef4444' : '#166534'
                                            }}>
                                                {record.risk}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Reports;
