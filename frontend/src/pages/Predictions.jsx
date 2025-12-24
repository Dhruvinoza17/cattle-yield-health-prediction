import React, { useState, useEffect } from 'react';
import { Search, AlertTriangle, CheckCircle, Loader, MessageCircle, ArrowLeft, Activity, Thermometer, Weight } from 'lucide-react';
import { api } from '../services/api';
import './Predictions.css';
import { useChat } from '../context/ChatContext';
import { auth, db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

const Predictions = () => {
    const { openChat, isOpen, setPrefillMessage } = useChat();

    // State
    const [animals, setAnimals] = useState([]);
    const [filteredAnimals, setFilteredAnimals] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAnimal, setSelectedAnimal] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch Animals from Firestore
    useEffect(() => {
        if (!auth.currentUser) return;

        const q = collection(db, "users", auth.currentUser.uid, "cattle_records");
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.data().Animal_ID || doc.id,
                ...doc.data(),
                // Normalize data for display
                yield: parseFloat(doc.data().predictedYield || doc.data().yield || 0).toFixed(1),
                disease: doc.data().healthStatus || doc.data().disease || 'Unknown',
                risk: doc.data().riskLevel || doc.data().risk || 'Low',
                date: doc.data().createdAt ? doc.data().createdAt.toDate() : new Date()
            }));

            // Sort by date (newest first)
            const sorted = data.sort((a, b) => b.date - a.date);
            setAnimals(sorted);
            setFilteredAnimals(sorted);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Search Handler
    useEffect(() => {
        if (!searchTerm) {
            setFilteredAnimals(animals);
        } else {
            const lower = searchTerm.toLowerCase();
            const filtered = animals.filter(a =>
                a.id.toLowerCase().includes(lower) ||
                (a.Breed && a.Breed.toLowerCase().includes(lower)) ||
                (a.disease && a.disease.toLowerCase().includes(lower))
            );
            setFilteredAnimals(filtered);
        }
    }, [searchTerm, animals]);

    const handleSmartChat = () => {
        if (!selectedAnimal) return;
        const question = `My cow (ID: ${selectedAnimal.id}) is diagnosed with ${selectedAnimal.disease}. What specific treatment plan do you recommend?`;
        setPrefillMessage(question);
        openChat();
    };

    const getRecommendations = (condition) => {
        switch (condition) {
            case 'Mastitis': return ['Isolate animal immediately.', 'Check udder temperature.', 'Consult vet for antibiotics.'];
            case 'Digestive Disorder': return ['Review feed quality.', 'Increase fiber intake.', 'Monitor rumination.'];
            case 'Heat Stress': return ['Increase ventilation.', 'Provide cool water.', 'Reduce activity.'];
            case 'Healthy': return ['Continue current nutrition plan.', 'Monitor for changes.'];
            default: return ['Consult veterinary expert.'];
        }
    };

    // RENDER: LIST VIEW
    if (!selectedAnimal) {
        return (
            <div>
                <div className="page-header">
                    <h2>My Herd</h2>
                    <p>Manage and monitor your cattle's health and yield.</p>
                </div>

                <div className="card" style={{ marginBottom: '2rem' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Search by ID, Breed, or Status..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.8rem 0.8rem 0.8rem 2.8rem',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '1rem',
                                outline: 'none'
                            }}
                        />
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}><Loader className="spin" /></div>
                ) : filteredAnimals.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        <p>No animals found matching your search.</p>
                    </div>
                ) : (
                    <div className="grid-cols-3" style={{ gap: '1.5rem' }}>
                        {filteredAnimals.map((animal, idx) => (
                            <div
                                key={idx}
                                className="card animal-card"
                                onClick={() => setSelectedAnimal(animal)}
                                style={{
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    borderLeft: `4px solid ${animal.risk === 'High' ? '#ef4444' : '#10b981'}`
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{animal.id}</h3>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: '12px',
                                        background: animal.risk === 'High' ? '#fee2e2' : '#dcfce7',
                                        color: animal.risk === 'High' ? '#ef4444' : '#166534',
                                        fontWeight: '600'
                                    }}>
                                        {animal.disease}
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem' }}>
                                    {animal.Breed || 'Unknown Breed'} • {animal.Age ? `${animal.Age} Mo` : 'N/A'}
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                                        <Activity size={16} color="var(--primary)" />
                                        <span>{animal.yield} L</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                                        <Weight size={16} color="#f59e0b" />
                                        <span>{animal.Weight || '-'} kg</span>
                                    </div>
                                    {animal.risk === 'High' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const question = `My cow (ID: ${animal.id}) is diagnosed with ${animal.disease}. What specific treatment plan do you recommend?`;
                                                setPrefillMessage(question);
                                                openChat();
                                            }}
                                            className="btn-sm"
                                            style={{
                                                marginLeft: 'auto',
                                                background: '#fee2e2',
                                                color: '#ef4444',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '24px',
                                                height: '24px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer'
                                            }}
                                            title="Chat about Risk"
                                        >
                                            <MessageCircle size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // RENDER: DETAIL VIEW (Selected Animal)
    return (
        <div className="fade-in">
            <button
                onClick={() => setSelectedAnimal(null)}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    color: 'var(--text-main)',
                    transition: 'transform 0.2s',
                    marginTop: '-10px'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'translateX(-5px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateX(0)'}
                title="Back to Herd"
            >
                <ArrowLeft size={32} />
            </button>

            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h2>{selectedAnimal.id} Details</h2>
                    <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '1rem',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        backgroundColor: selectedAnimal.risk === 'High' ? '#fef2f2' : '#f0fdf4',
                        color: selectedAnimal.risk === 'High' ? '#ef4444' : '#166534'
                    }}>
                        {selectedAnimal.disease}
                    </span>
                </div>
                {selectedAnimal.risk === 'High' && (
                    <button
                        onClick={() => {
                            const question = `My cow (ID: ${selectedAnimal.id}) is diagnosed with ${selectedAnimal.disease}. What specific treatment plan do you recommend?`;
                            setPrefillMessage(question);
                            openChat();
                        }}
                        className="btn btn-primary"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', display: 'flex', gap: '0.5rem', background: '#ef4444', border: 'none' }}
                    >
                        <MessageCircle size={18} /> Chat with AI
                    </button>
                )}
            </div>

            <div className="card">
                {/* DETAILS GRID */}
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Cattle Information</h4>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px'
                }}>
                    <div><div className="detail-label">Breed</div><div className="detail-value">{selectedAnimal.Breed || '-'}</div></div>
                    <div><div className="detail-label">Age</div><div className="detail-value">{selectedAnimal.Age || '-'} Months</div></div>
                    <div><div className="detail-label">Weight</div><div className="detail-value">{selectedAnimal.Weight || '-'} kg</div></div>
                    <div><div className="detail-label">Feed</div><div className="detail-value">{selectedAnimal.Feed_Type || '-'}</div></div>
                    <div><div className="detail-label">Temperature</div><div className="detail-value">{selectedAnimal.Body_Temperature || '-'}°C</div></div>
                    <div><div className="detail-label">Last Updated</div><div className="detail-value">{new Date(selectedAnimal.date).toLocaleDateString()}</div></div>
                </div>

                <div className="grid-cols-2" style={{ marginBottom: '1.5rem', gap: '2rem' }}>
                    <div style={{ background: '#f0fdf4', padding: '1.5rem', borderRadius: '12px', border: '1px solid #dcfce7' }}>
                        <div style={{ fontSize: '0.9rem', color: '#166534', marginBottom: '0.5rem' }}>Predicted Yield</div>
                        <div style={{ fontSize: '2rem', fontWeight: '700', color: '#15803d' }}>{selectedAnimal.yield} L</div>
                    </div>
                    <div style={{ background: selectedAnimal.risk === 'High' ? '#fff1f2' : '#f0fdf4', padding: '1.5rem', borderRadius: '12px', border: `1px solid ${selectedAnimal.risk === 'High' ? '#ffe4e6' : '#dcfce7'}` }}>
                        <div style={{ fontSize: '0.9rem', color: selectedAnimal.risk === 'High' ? '#9f1239' : '#166534', marginBottom: '0.5rem' }}>Health Status</div>
                        <div style={{ fontSize: '2rem', fontWeight: '700', color: selectedAnimal.risk === 'High' ? '#be123c' : '#15803d' }}>{selectedAnimal.disease}</div>
                    </div>
                </div>

                {selectedAnimal.risk === 'High' && (
                    <>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Action Required</h4>
                        <div style={{ marginBottom: '1.5rem' }}>
                            {!isOpen && (
                                <button className="pulsing-btn" onClick={handleSmartChat}>
                                    <MessageCircle size={20} />
                                    Chat with AI about {selectedAnimal.id}
                                </button>
                            )}
                        </div>
                    </>
                )}

                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Recommendations</h4>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {getRecommendations(selectedAnimal.disease).map((rec, i) => (
                        <li key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                            <CheckCircle size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
                            {rec}
                        </li>
                    ))}
                </ul>
            </div>

            <style jsx>{`
                .detail-label { font-size: 0.8rem; color: #64748b; margin-bottom: 2px; }
                .detail-value { font-weight: 600; color: #334155; }
            `}</style>
        </div>
    );
};

export default Predictions;
