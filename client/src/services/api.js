import axios from "axios";

const api = axios.create({
    baseURL: '/api', // Relative URL - frontend served by backend
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