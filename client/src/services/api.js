import axios from "axios";

const api = axios.create({
    baseURL: 'http://localhost:3000',
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