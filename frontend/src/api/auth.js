import api from "./client";

export const loginApi = async (email, password) => {
    const { data } = await api.post("/api/auth/login", { email, password });
    return data;
};

export const registerApi = async (payload) => {
    const { data } = await api.post("/api/auth/register", payload);
    return data;
};

export const meApi = async () => {
    const { data } = await api.get("/api/auth/me");
    return data;
};

export const logoutApi = async () => {
    const { data } = await api.post("/api/auth/logout");
    return data;
};