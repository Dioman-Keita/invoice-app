import axios from "axios";

const api = axios.create({
    baseURL: '/api', // URL relative - le backend sert le frontend
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