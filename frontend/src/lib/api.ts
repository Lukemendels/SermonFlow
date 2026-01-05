import axios from 'axios';

// Create an Axios instance
const api = axios.create({
    baseURL: 'http://localhost:8080', // In production, this would be an env var
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
