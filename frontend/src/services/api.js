import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000';

export const api = {
    // Check backend health
    checkHealth: async () => {
        try {
            const response = await axios.get(`${API_URL}/`);
            return response.data;
        } catch (error) {
            console.error("Backend offline", error);
            return null;
        }
    },

    // Get cattle details by ID (Mocked for now or fetched from CSV via API)
    getCattle: async (id) => {
        // We'll add this endpoint to backend
        const response = await axios.get(`${API_URL}/cattle/${id}`);
        return response.data;
    },

    // Predict Yield
    predictYield: async (data) => {
        const response = await axios.post(`${API_URL}/predict-yield`, data);
        return response.data;
    },

    // Predict Disease
    predictDisease: async (data) => {
        const response = await axios.post(`${API_URL}/predict-disease`, data);
        return response.data;
    }
};
