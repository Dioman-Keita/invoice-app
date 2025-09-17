import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    withCredentials: true,
    timeout: 10000,
});

api.interceptors.response.use(
    (res) => res.data,
    (err) => {
        return Promise.reject(err);
    }
);

export default api;