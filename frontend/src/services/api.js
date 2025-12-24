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
    },

    // Save Record to CSV
    saveRecord: async (data) => {
        const response = await axios.post(`${API_URL}/save-record`, data);
        return response.data;
    },

    // Get Next Automated ID
    getNextId: async () => {
        try {
            const response = await axios.get(`${API_URL}/next-id`);
            return response.data.next_id;
        } catch (error) {
            console.error("Failed to fetch ID", error);
            return "CATTLE_NEW"; // Fallback
        }
    },

    // --- Authentication ---
    register: async (email, password) => {
        const response = await axios.post(`${API_URL}/auth/register`, { email, password });
        return response.data;
    },

    verifyOtp: async (email, otp) => {
        const response = await axios.post(`${API_URL}/auth/verify`, { email, otp });
        return response.data;
    },

    login: async (email, password) => {
        const response = await axios.post(`${API_URL}/auth/login`, { email, password });
        return response.data;
    }
};
