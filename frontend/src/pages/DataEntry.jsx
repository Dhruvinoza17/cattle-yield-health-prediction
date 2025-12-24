import React, { useState } from 'react';
import { api } from '../services/api';
import { Loader, CheckCircle, AlertTriangle } from 'lucide-react';
import './DataEntry.css';

const DataEntry = () => {
    const [activeTab, setActiveTab] = useState('animal');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        // Animal
        Animal_ID: '',
        Breed: 'Holstein',
        Age: '',
        Weight: '',
        Lactation_Stage: 'Early',
        Parity: '',
        // Feed
        Feed_Type: 'Green Fodder',
        Feed_Quantity: '',
        Protein_Content: '',
        // Activity
        Walking_Distance: '',
        Grazing_Duration: '',
        Rumination_Time: '',
        Rest_Hours: '',
        // Health & Env
        Body_Temperature: '',
        Heart_Rate: '',
        Vaccination_Status: 'Vaccinated',
        Temperature: '', // Ambient
        Humidity: '',
        Season: 'Winter',
        Housing_Quality: 'Average'
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        setResult(null);

        // Basic validation
        if (!formData.Age || !formData.Weight) {
            setError('Please fill in required fields (Age, Weight, etc.)');
            setLoading(false);
            return;
        }

        try {
            // Prepare payload (convert types)
            const payload = {
                ...formData,
                Age: parseInt(formData.Age) || 0,
                Weight: parseFloat(formData.Weight) || 0,
                Parity: parseInt(formData.Parity) || 1,
                Feed_Quantity: parseFloat(formData.Feed_Quantity) || 0,
                Protein_Content: parseFloat(formData.Protein_Content) || 0,
                Walking_Distance: parseFloat(formData.Walking_Distance) || 0,
                Grazing_Duration: parseFloat(formData.Grazing_Duration) || 0,
                Rumination_Time: parseFloat(formData.Rumination_Time) || 0,
                Rest_Hours: parseFloat(formData.Rest_Hours) || 0,
                Body_Temperature: parseFloat(formData.Body_Temperature) || 38.5,
                Heart_Rate: parseFloat(formData.Heart_Rate) || 60,
                Temperature: parseFloat(formData.Temperature) || 25,
                Humidity: parseInt(formData.Humidity) || 50
            };

            const yieldRes = await api.predictYield(payload);
            const diseaseRes = await api.predictDisease(payload);

            setResult({
                yield: yieldRes.predicted_milk_yield_liters,
                health: diseaseRes.predicted_condition,
                risk: diseaseRes.risk_assessment,
                confidence: diseaseRes.confidence_scores[diseaseRes.predicted_condition] || 0
            });

        } catch (err) {
            console.error(err);
            setError('Failed to analyze. Ensure Backend is running.');
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'animal', label: 'Animal Profile' },
        { id: 'feed', label: 'Feed & Nutrition' },
        { id: 'activity', label: 'Activity & Behavior' },
        { id: 'health', label: 'Health & Environment' },
    ];

    return (
        <div className="data-entry-page">
            <div className="page-header">
                <h2>Data Entry & Analysis</h2>
                <p>Input daily observations to get instant AI predictions.</p>
            </div>

            <div className="card form-container">
                <div className="form-tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <form className="entry-form">
                    {activeTab === 'animal' && (
                        <div className="form-section fade-in">
                            <h3>Animal Details</h3>
                            <div className="grid-cols-2">
                                <div className="form-group">
                                    <label>Cattle ID / Tag</label>
                                    <input name="Animal_ID" value={formData.Animal_ID} onChange={handleChange} type="text" placeholder="e.g., CATTLE_New" />
                                </div>
                                <div className="form-group">
                                    <label>Breed</label>
                                    <select name="Breed" value={formData.Breed} onChange={handleChange}>
                                        <option>Holstein</option>
                                        <option>Jersey</option>
                                        <option>Murrah Buffalo</option>
                                        <option>Gir</option>
                                        <option>Sahiwal</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Age (Months)</label>
                                    <input name="Age" value={formData.Age} onChange={handleChange} type="number" />
                                </div>
                                <div className="form-group">
                                    <label>Weight (kg)</label>
                                    <input name="Weight" value={formData.Weight} onChange={handleChange} type="number" />
                                </div>
                                <div className="form-group">
                                    <label>Lactation Stage</label>
                                    <select name="Lactation_Stage" value={formData.Lactation_Stage} onChange={handleChange}>
                                        <option>Early</option>
                                        <option>Peak</option>
                                        <option>Mid</option>
                                        <option>Late</option>
                                        <option>Dry</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Parity (Calvings)</label>
                                    <input name="Parity" value={formData.Parity} onChange={handleChange} type="number" />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'feed' && (
                        <div className="form-section fade-in">
                            <h3>Feed & Nutrition</h3>
                            <div className="grid-cols-2">
                                <div className="form-group">
                                    <label>Feed Type</label>
                                    <select name="Feed_Type" value={formData.Feed_Type} onChange={handleChange}>
                                        <option>Green Fodder</option>
                                        <option>Dry Fodder</option>
                                        <option>Mixed Ration</option>
                                        <option>Silage</option>
                                        <option>Concentrates</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Quantity (kg)</label>
                                    <input name="Feed_Quantity" value={formData.Feed_Quantity} onChange={handleChange} type="number" step="0.1" />
                                </div>
                                <div className="form-group">
                                    <label>Protein Content (%)</label>
                                    <input name="Protein_Content" value={formData.Protein_Content} onChange={handleChange} type="number" step="0.1" placeholder="e.g., 14" />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'activity' && (
                        <div className="form-section fade-in">
                            <h3>Activity & Behavior</h3>
                            <div className="grid-cols-2">
                                <div className="form-group">
                                    <label>Walking Distance (km)</label>
                                    <input name="Walking_Distance" value={formData.Walking_Distance} onChange={handleChange} type="number" step="0.1" />
                                </div>
                                <div className="form-group">
                                    <label>Grazing Duration (hrs)</label>
                                    <input name="Grazing_Duration" value={formData.Grazing_Duration} onChange={handleChange} type="number" step="0.5" />
                                </div>
                                <div className="form-group">
                                    <label>Rumination Time (hrs)</label>
                                    <input name="Rumination_Time" value={formData.Rumination_Time} onChange={handleChange} type="number" step="0.5" />
                                </div>
                                <div className="form-group">
                                    <label>Resting Time (hrs)</label>
                                    <input name="Rest_Hours" value={formData.Rest_Hours} onChange={handleChange} type="number" step="0.5" />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'health' && (
                        <div className="form-section fade-in">
                            <h3>Health & Environment</h3>
                            <div className="grid-cols-2">
                                <div className="form-group">
                                    <label>Body Temperature (°C)</label>
                                    <input name="Body_Temperature" value={formData.Body_Temperature} onChange={handleChange} type="number" step="0.1" placeholder="Normal: 38-39" />
                                </div>
                                <div className="form-group">
                                    <label>Heart Rate (BPM)</label>
                                    <input name="Heart_Rate" value={formData.Heart_Rate} onChange={handleChange} type="number" />
                                </div>
                                <div className="form-group">
                                    <label>Vaccination Status</label>
                                    <select name="Vaccination_Status" value={formData.Vaccination_Status} onChange={handleChange}>
                                        <option>Vaccinated</option>
                                        <option>Pending</option>
                                        <option>Overdue</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Ambient Temp (°C)</label>
                                    <input name="Temperature" value={formData.Temperature} onChange={handleChange} type="number" step="0.1" />
                                </div>
                                <div className="form-group">
                                    <label>Humidity (%)</label>
                                    <input name="Humidity" value={formData.Humidity} onChange={handleChange} type="number" />
                                </div>
                                <div className="form-group">
                                    <label>Season</label>
                                    <select name="Season" value={formData.Season} onChange={handleChange}>
                                        <option>Winter</option>
                                        <option>Summer</option>
                                        <option>Monsoon</option>
                                        <option>Spring</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Housing Quality</label>
                                    <select name="Housing_Quality" value={formData.Housing_Quality} onChange={handleChange}>
                                        <option>Well Ventilated</option>
                                        <option>Average</option>
                                        <option>Poor</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="form-actions">
                        {error && <span style={{ color: 'red', marginRight: '1rem' }}>{error}</span>}
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? <Loader className="spin" size={18} /> : 'Save & Analyze'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Prediction Result Modal/Overlay */}
            {result && (
                <div className="result-overlay fade-in">
                    <div className="card result-card">
                        <h3>Analysis Complete</h3>
                        <div className="result-grid">
                            <div className="result-item">
                                <span className="label">Predicted Yield</span>
                                <span className="value yield">{result.yield} L</span>
                            </div>
                            <div className="result-item">
                                <span className="label">Health Status</span>
                                <span className={`value status ${result.risk === 'High' ? 'danger' : 'success'}`}>
                                    {result.health}
                                </span>
                            </div>
                        </div>
                        {result.risk === 'High' && (
                            <div className="alert-box">
                                <AlertTriangle size={18} />
                                <span>High Risk Detected ({result.confidence}%)</span>
                            </div>
                        )}
                        <button className="btn btn-outline" onClick={() => setResult(null)}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataEntry;

