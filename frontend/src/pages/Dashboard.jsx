import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Milk, AlertCircle, TrendingUp, X, MessageCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import './Dashboard.css';
import { useChat } from '../context/ChatContext';
import { auth, db } from '../firebase';
import { collection, getDocs, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

const StatsCard = ({ title, value, subtext, icon, trend, color }) => (
    <div className="card stats-card">
        <div className={`icon-wrapper ${color}`}>
            {icon}
        </div>
        <div className="stats-info">
            <h3>{title}</h3>
            <div className="value">{value}</div>
            <div className="subtext">
                <span className={trend === 'up' ? 'trend-up' : 'trend-down'}>
                    {trend === 'up' ? '↑' : '↓'}
                </span>
                {subtext}
            </div>
        </div>
    </div>
);

const Dashboard = () => {
    const navigate = useNavigate();
    const { openChat, setPrefillMessage } = useChat();
    const [stats, setStats] = useState({
        totalCattle: 0,
        dailyYield: 0,
        alerts: 0,
        avgYield: 0
    });
    const [recentAlerts, setRecentAlerts] = useState([]);
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [pieData, setPieData] = useState([]);
    const [barData, setBarData] = useState([]);
    const [radarData, setRadarData] = useState([]);
    const [yieldDistData, setYieldDistData] = useState([]);
    const [filterCount, setFilterCount] = useState(10);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#ef4444'];

    const handleLoadDemoData = async () => {
        if (!auth.currentUser) return;
        const confirmLoad = window.confirm("Load 5 demo records to visualize graphs?");
        if (!confirmLoad) return;

        const demoData = [
            { Animal_ID: 'Cow A1', predictedYield: 12.0, healthStatus: 'Mastitis', riskLevel: 'High', yield: 12.0, disease: 'Mastitis', risk: 'High' },
            { Animal_ID: 'Cow A2', predictedYield: 10.0, healthStatus: 'Heat Stress', riskLevel: 'High', yield: 10.0, disease: 'Heat Stress', risk: 'High' },
            { Animal_ID: 'Cow B1', predictedYield: 25.0, healthStatus: 'Healthy', riskLevel: 'Low', yield: 25.0, disease: 'Healthy', risk: 'Low' },
            { Animal_ID: 'Cow B2', predictedYield: 18.0, healthStatus: 'Healthy', riskLevel: 'Low', yield: 18.0, disease: 'Healthy', risk: 'Low' },
            { Animal_ID: 'Cow B3', predictedYield: 15.0, healthStatus: 'Healthy', riskLevel: 'Low', yield: 15.0, disease: 'Healthy', risk: 'Low' },
        ];

        try {
            for (const record of demoData) {
                await addDoc(collection(db, "users", auth.currentUser.uid, "cattle_records"), {
                    ...record,
                    createdAt: serverTimestamp()
                });
            }
        } catch (error) {
            console.error("Failed to load demo data", error);
            alert("Error loading demo data. Check console.");
        }
    };

    useEffect(() => {
        let unsubscribe = () => { };

        const setupListener = (user) => {
            if (!user) return;

            // Real-time listener
            unsubscribe = onSnapshot(
                collection(db, "users", user.uid, "cattle_records"),
                (querySnapshot) => {
                    const history = querySnapshot.docs.map(doc => {
                        const data = doc.data();
                        return {
                            id: data.Animal_ID || doc.id,
                            yield: parseFloat(data.predictedYield || data.yield || 0),
                            disease: data.healthStatus || data.disease || 'Unknown',
                            risk: data.riskLevel || data.risk || 'Low',
                            date: data.createdAt ? data.createdAt.toDate() : new Date(),
                            ...data
                        };
                    });

                    const totalCattle = history.length;
                    const totalYield = history.reduce((acc, curr) => acc + (curr.yield || 0), 0);
                    const alerts = history.filter(h => h.risk === 'High');

                    setStats({
                        totalCattle: totalCattle > 0 ? totalCattle : 0,
                        dailyYield: totalYield.toFixed(1),
                        alerts: alerts.length,
                        avgYield: totalCattle > 0 ? (totalYield / totalCattle).toFixed(1) : 0
                    });

                    setRecentAlerts(alerts.slice(0, 5));

                    // Prepare Chart Data based on Filter
                    let limit = filterCount;
                    if (filterCount === 'All') limit = history.length;

                    // Sort by date descending for "recent" slice, then reverse for chart chronological order
                    const sortedHistory = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));
                    const recentHistory = sortedHistory.slice(0, limit).reverse();

                    const data = recentHistory.map(item => ({
                        name: new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        yield: parseFloat(item.yield),
                        disease: item.disease
                    }));
                    setChartData(data);

                    // Pie Chart Data
                    const diseaseCounts = {};
                    history.forEach(h => {
                        const condition = h.disease || 'Unknown';
                        diseaseCounts[condition] = (diseaseCounts[condition] || 0) + 1;
                    });
                    const pData = Object.keys(diseaseCounts).map((key, index) => ({
                        name: key,
                        value: diseaseCounts[key]
                    }));
                    setPieData(pData);

                    // Bar Chart Data
                    const conditionYields = {};
                    const conditionCounts = {};
                    const yieldBuckets = { 'Low (<15L)': 0, 'Medium (15-25L)': 0, 'High (>25L)': 0 };

                    history.forEach(h => {
                        const cond = h.disease || 'Unknown';
                        const y = parseFloat(h.yield || 0);

                        conditionYields[cond] = (conditionYields[cond] || 0) + y;
                        conditionCounts[cond] = (conditionCounts[cond] || 0) + 1;

                        if (y < 15) yieldBuckets['Low (<15L)']++;
                        else if (y <= 25) yieldBuckets['Medium (15-25L)']++;
                        else yieldBuckets['High (>25L)']++;
                    });

                    const bData = Object.keys(conditionYields).map(key => ({
                        name: key,
                        avgYield: parseFloat((conditionYields[key] / conditionCounts[key]).toFixed(1))
                    }));
                    setBarData(bData);

                    // Radar Data
                    const allDiseases = ['Mastitis', 'Heat Stress', 'Digestive Disorder', 'Healthy'];
                    setRadarData(allDiseases.map(d => ({
                        subject: d,
                        A: diseaseCounts[d] || 0,
                        fullMark: history.length
                    })));

                    // Yield Distribution Data
                    setYieldDistData(Object.keys(yieldBuckets).map(key => ({
                        range: key,
                        count: yieldBuckets[key]
                    })));

                },
                (error) => {
                    console.error("Error fetching dashboard data:", error);
                }
            );
        };

        const authUnsub = auth.onAuthStateChanged((user) => {
            if (user) setupListener(user);
            else {
                unsubscribe();
                localStorage.removeItem('token');
                navigate('/');
            }
        });

        return () => {
            authUnsub();
            unsubscribe();
        };
    }, [filterCount]);

    return (
        <div className="dashboard">
            <div className="page-header">
                <h2>Farm Overview</h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <p>Real-time insights on cattle health and milk production.</p>
                    {/* Debug/Help Button if stats are 0 */}
                    {stats.totalCattle === 0 && (
                        <button
                            onClick={handleLoadDemoData}
                            className="btn btn-primary"
                            style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem', background: '#ec4899', border: 'none' }}
                        >
                            + Load Demo Data
                        </button>
                    )}
                </div>
            </div>

            <div className="stats-grid grid-cols-4">
                <StatsCard
                    title="Total Scans"
                    value={stats.totalCattle}
                    subtext="Cattle Analyzed"
                    icon={<Activity size={24} />}
                    trend="up"
                    color="blue"
                />
                <StatsCard
                    title="Total Yield (Est.)"
                    value={`${stats.dailyYield} L`}
                    subtext="Based on scans"
                    icon={<Milk size={24} />}
                    trend="up"
                    color="green"
                />
                <StatsCard
                    title="Health Alerts"
                    value={stats.alerts}
                    subtext="High Risk Detected"
                    icon={<AlertCircle size={24} />}
                    trend={stats.alerts > 0 ? "down" : "up"}
                    color="red"
                />
                <StatsCard
                    title="Avg. Yield / Cow"
                    value={`${stats.avgYield} L`}
                    subtext="Efficient"
                    icon={<TrendingUp size={24} />}
                    trend="up"
                    color="orange"
                />
            </div>

            <div className="dashboard-content grid-cols-2">
                <div className="card chart-card">
                    <div className="card-header">
                        <h3>Milk Production Trend</h3>
                        <select
                            className="btn btn-outline"
                            style={{ fontSize: '0.8rem', padding: '0.4rem', cursor: 'pointer' }}
                            value={filterCount}
                            onChange={(e) => setFilterCount(e.target.value === 'All' ? 'All' : parseInt(e.target.value))}
                        >
                            <option value={10}>Last 10 Scans</option>
                            <option value={15}>Last 15 Scans</option>
                            <option value="All">All Scans</option>
                        </select>
                    </div>
                    {chartData.length > 0 ? (
                        <div style={{ width: '100%', height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} unit=" L" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="yield"
                                        stroke="var(--primary)"
                                        strokeWidth={3}
                                        dot={{ fill: 'var(--primary)', strokeWidth: 2 }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="chart-placeholder">
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>No data yet.</p>
                            <button onClick={handleLoadDemoData} className="btn btn-outline">
                                Load Demo Data to Visualize
                            </button>
                        </div>
                    )}
                </div>

                <div className="card alerts-card">
                    <div className="card-header">
                        <h3>Recent High Risk Alerts</h3>
                    </div>
                    <div className="alerts-list">
                        {recentAlerts.length === 0 ? (
                            <p style={{ padding: '1rem', color: 'var(--text-muted)' }}>No high risk alerts recently.</p>
                        ) : (
                            recentAlerts.map((alert, i) => (
                                <div
                                    key={i}
                                    className="alert-item high"
                                    onClick={() => setSelectedAlert(alert)}
                                    style={{ cursor: 'pointer', transition: 'transform 0.2s', padding: '1rem' }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <div className="alert-icon">⚠️</div>
                                    <div className="alert-details">
                                        <h4>{alert.id || 'Unknown Cow'} - Risk Detected</h4>
                                        <p>Condition: {alert.disease}</p>
                                    </div>
                                    <span className="alert-time">{new Date(alert.date).toLocaleTimeString()}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="dashboard-content grid-cols-2" style={{ marginTop: '1.5rem' }}>
                <div className="card chart-card">
                    <div className="card-header">
                        <h3>Health Status Distribution</h3>
                    </div>
                    {pieData.length > 0 ? (
                        <div style={{ width: '100%', height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="chart-placeholder">
                            <p style={{ color: 'var(--text-muted)' }}>No data available yet.</p>
                        </div>
                    )}
                </div>

                <div className="card chart-card">
                    <div className="card-header">
                        <h3>Avg. Yield by Condition</h3>
                    </div>
                    {barData.length > 0 ? (
                        <div style={{ width: '100%', height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" unit=" L" stroke="#94a3b8" fontSize={12} />
                                    <YAxis dataKey="name" type="category" width={100} stroke="#94a3b8" fontSize={12} tickLine={false} />
                                    <Tooltip cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="avgYield" fill="#82ca9d" radius={[0, 4, 4, 0]}>
                                        {barData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.name === 'Healthy' ? '#22c55e' : '#ef4444'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="chart-placeholder">
                            <p style={{ color: 'var(--text-muted)' }}>No data available yet.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="dashboard-content grid-cols-2" style={{ marginTop: '1.5rem' }}>
                <div className="card chart-card">
                    <div className="card-header">
                        <h3>Disease Risk Profile</h3>
                    </div>
                    {radarData.length > 0 ? (
                        <div style={{ width: '100%', height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="subject" />
                                    <PolarRadiusAxis />
                                    <Radar name="Disease Frequency" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                                    <Tooltip />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="chart-placeholder">
                            <p style={{ color: 'var(--text-muted)' }}>No data available yet.</p>
                        </div>
                    )}
                </div>

                <div className="card chart-card">
                    <div className="card-header">
                        <h3>Productivity Distribution</h3>
                    </div>
                    {yieldDistData.length > 0 ? (
                        <div style={{ width: '100%', height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={yieldDistData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="range" stroke="#94a3b8" fontSize={11} />
                                    <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                                    <Tooltip cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Number of Cows" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="chart-placeholder">
                            <p style={{ color: 'var(--text-muted)' }}>No data available yet.</p>
                        </div>
                    )}
                </div>
            </div>
            <div style={{ marginBottom: '2rem' }}></div>

            {selectedAlert && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100vh',
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        padding: '2rem',
                        borderRadius: '1rem',
                        width: '90%',
                        maxWidth: '500px',
                        position: 'relative',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                    }}>
                        <button
                            onClick={() => setSelectedAlert(null)}
                            style={{
                                position: 'absolute',
                                right: '1rem',
                                top: '1rem',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#64748b'
                            }}
                        >
                            <X size={24} />
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <div style={{ padding: '0.75rem', background: '#fef2f2', borderRadius: '50%', color: '#ef4444' }}>
                                <AlertCircle size={32} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, color: '#1e293b' }}>Critical Risk Alert</h3>
                                <p style={{ margin: 0, color: '#ef4444', fontWeight: '600' }}>{selectedAlert.disease}</p>
                            </div>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ color: '#64748b' }}>Cattle ID:</span>
                                <span style={{ fontWeight: '600' }}>{selectedAlert.id}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ color: '#64748b' }}>Detected At:</span>
                                <span style={{ fontWeight: '600' }}>{new Date(selectedAlert.date).toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ color: '#64748b' }}>Predicted Yield:</span>
                                <span style={{ fontWeight: '600' }}>{selectedAlert.yield} L</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Status:</span>
                                <span style={{ color: '#ef4444', fontWeight: 'bold' }}>High Risk</span>
                            </div>
                        </div>

                        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.25rem' }}>
                                Immediate attention recommended. Isolate animal and consult vet.
                            </p>

                            <button
                                onClick={() => {
                                    const question = `My cow (ID: ${selectedAlert.id}) has a High Risk alert for ${selectedAlert.disease} detected at ${new Date(selectedAlert.date).toLocaleTimeString()}. What immediate steps should I take?`;
                                    setPrefillMessage(question);
                                    setSelectedAlert(null); // Close modal
                                    openChat(); // Open chat
                                }}
                                className="btn"
                                style={{
                                    width: '100%',
                                    background: 'linear-gradient(45deg, #ef4444, #f87171)',
                                    color: 'white',
                                    border: 'none',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem',
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                <MessageCircle size={18} />
                                Chat with AI about this Risk
                            </button>

                            <button
                                onClick={() => setSelectedAlert(null)}
                                className="btn btn-outline"
                                style={{ width: '100%', borderColor: '#cbd5e1', color: '#64748b' }}
                            >
                                Close Window
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
