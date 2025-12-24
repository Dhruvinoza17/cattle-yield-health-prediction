import React, { useState } from 'react';
import { Search, AlertTriangle, CheckCircle, Loader, MessageCircle } from 'lucide-react';
import { api } from '../services/api';
import './Predictions.css';
import { useChat } from '../context/ChatContext';

const Predictions = () => {
    const { openChat, isOpen, setPrefillMessage } = useChat();
    const [cowId, setCowId] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSmartChat = () => {
        if (!result) return;
        const question = `My cow (ID: ${result.id}) is diagnosed with ${result.disease} with ${result.confidence}% confidence. What specific treatment plan do you recommend?`;
        setPrefillMessage(question);
        openChat();
    };

    const handlePredict = async () => {
        if (!cowId) return;

        setLoading(true);
        setError('');
        setResult(null);

        try {
            // 1. Fetch Cattle Data
            const cattleData = await api.getCattle(cowId);

            // Sanitize data: Remove fields that backend Pydantic model doesn't accept
            // The model expects: Breed, Age, Weight, ..., Housing_Quality
            // It does NOT want: Animal_ID, Milk_Yield, Disease_Label, or any index columns
            const { Animal_ID, Milk_Yield, Disease_Label, ...modelInput } = cattleData;

            // FIX: Ensure Humidity and Days_Inside are integers (Backend requires int)
            if (modelInput.Humidity) modelInput.Humidity = Math.round(modelInput.Humidity);
            if (modelInput.Days_Inside) modelInput.Days_Inside = Math.round(modelInput.Days_Inside);

            // 2. Predict Yield
            const yieldRes = await api.predictYield(modelInput);

            // 3. Predict Disease
            const diseaseRes = await api.predictDisease(modelInput);

            // Save to History
            saveHistory(cattleData, yieldRes, diseaseRes);

            // Combine results
            setResult({
                id: cattleData.Animal_ID,
                details: {
                    breed: cattleData.Breed,
                    age: cattleData.Age,
                    weight: cattleData.Weight,
                    feed: cattleData.Feed_Type,
                    temp: cattleData.Body_Temperature,
                    activity: cattleData.Walking_Distance ? `${parseFloat(cattleData.Walking_Distance).toFixed(1)} km` : 'N/A'
                },
                yield: `${yieldRes.predicted_milk_yield_liters} L`,
                healthStatus: diseaseRes.risk_assessment === 'High' ? 'Risk Detected' : 'Healthy',
                riskLevel: diseaseRes.risk_assessment,
                disease: diseaseRes.predicted_condition,
                confidence: diseaseRes.confidence_scores[diseaseRes.predicted_condition] || 0,
                recommendations: getRecommendations(diseaseRes.predicted_condition)
            });

        } catch (err) {
            console.error("Prediction Error:", err);
            let errorMessage = err.message || 'Connection failed';

            if (err.response?.data?.detail) {
                const detail = err.response.data.detail;
                errorMessage = typeof detail === 'object' ? JSON.stringify(detail) : detail;
            }

            setError(`Error details: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const saveHistory = (cattle, yieldRes, diseaseRes) => {
        const entry = {
            id: cattle.Animal_ID,
            date: new Date().toISOString(),
            yield: yieldRes.predicted_milk_yield_liters,
            disease: diseaseRes.predicted_condition,
            risk: diseaseRes.risk_assessment
        };
        const history = JSON.parse(localStorage.getItem('predictionHistory') || '[]');
        history.unshift(entry); // Add to top
        localStorage.setItem('predictionHistory', JSON.stringify(history.slice(0, 50))); // Keep last 50
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

    return (
        <div>
            <div className="page-header">
                <h2>Health & Yield Predictions</h2>
                <p>AI-powered analysis for individual cattle.</p>
            </div>

            <div className="card" style={{ width: '100%', margin: '0 auto' }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={20} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Enter Cow ID (e.g., CATTLE_1042)"
                            value={cowId}
                            onChange={(e) => setCowId(e.target.value)}
                            style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={handlePredict} disabled={loading}>
                        {loading ? <Loader className="spin" size={18} /> : 'Analyze'}
                    </button>
                </div>

                {error && (
                    <div style={{ padding: '1rem', background: '#fef2f2', color: '#ef4444', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>
                        {error}
                    </div>
                )}

                {result && (
                    <div className="prediction-result fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3>Analysis Results for {result.id}</h3>
                            <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '1rem',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                backgroundColor: result.riskLevel === 'High' ? '#fef2f2' : '#f0fdf4',
                                color: result.riskLevel === 'High' ? '#ef4444' : '#166534'
                            }}>
                                {result.healthStatus}
                            </span>
                        </div>

                        {/* ANIMAL DETAILS SECTION */}
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Cattle Details</h4>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                            gap: '1rem',
                            marginBottom: '1.5rem',
                            padding: '1rem',
                            backgroundColor: '#f8fafc',
                            borderRadius: 'var(--radius-md)'
                        }}>
                            <div><div style={{ fontSize: '0.8rem', color: '#64748b' }}>Breed</div><div style={{ fontWeight: '600' }}>{result.details.breed}</div></div>
                            <div><div style={{ fontSize: '0.8rem', color: '#64748b' }}>Age</div><div style={{ fontWeight: '600' }}>{result.details.age} Months</div></div>
                            <div><div style={{ fontSize: '0.8rem', color: '#64748b' }}>Weight</div><div style={{ fontWeight: '600' }}>{result.details.weight} kg</div></div>
                            <div><div style={{ fontSize: '0.8rem', color: '#64748b' }}>Feed</div><div style={{ fontWeight: '600' }}>{result.details.feed}</div></div>
                            <div><div style={{ fontSize: '0.8rem', color: '#64748b' }}>Temp</div><div style={{ fontWeight: '600' }}>{result.details.temp}°C</div></div>
                            <div><div style={{ fontSize: '0.8rem', color: '#64748b' }}>Activity</div><div style={{ fontWeight: '600' }}>{result.details.activity}</div></div>
                        </div>

                        <div className="grid-cols-2" style={{ marginBottom: '1.5rem' }}>
                            <div
                                style={{
                                    background: '#f0fdf4',
                                    padding: '1rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid #dcfce7'
                                }}
                            >
                                <div style={{ fontSize: '0.85rem', color: '#166534' }}>Predicted Yield</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#15803d' }}>{result.yield}</div>
                            </div>
                            <div
                                style={{
                                    background: result.riskLevel === 'High' ? '#fff1f2' : '#f0fdf4',
                                    padding: '1rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid #ffe4e6'
                                }}
                            >
                                <div style={{ fontSize: '0.85rem', color: result.riskLevel === 'High' ? '#9f1239' : '#166534' }}>Condition</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: '700', color: result.riskLevel === 'High' ? '#be123c' : '#15803d' }}>{result.disease}</div>
                            </div>
                        </div>

                        {result.riskLevel === 'High' && (
                            <>
                                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Detected Issues</h4>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', padding: '0.75rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-sm)' }}>
                                    <AlertTriangle size={18} color="#ef4444" />
                                    <span style={{ fontWeight: '600' }}>{result.disease}</span>
                                    <span style={{ color: '#64748b' }}>- {result.confidence}% Confidence</span>
                                </div>

                                {/* Pulsing Action Button */}
                                {!isOpen && (
                                    <button className="pulsing-btn" onClick={handleSmartChat}>
                                        <MessageCircle size={20} />
                                        Chat with AI about this Risk
                                    </button>
                                )}
                                <div style={{ marginBottom: '2rem' }}></div>
                            </>
                        )}

                        <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Recommendations</h4>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {result.recommendations.map((rec, i) => (
                                <li key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                    <CheckCircle size={16} color="#10b981" style={{ marginTop: '2px' }} />
                                    {rec}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Predictions;
