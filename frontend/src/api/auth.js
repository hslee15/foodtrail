import api from "./client";

export const loginApi = async (email, password) => {
    const { data } = await api.post("/api/auth/login", { email: email, password });
    return data;
};

export const registerApi = async (email, pw, displayName) => {
    const { data } = await api.post("/api/auth/register", {
        email: email,
        password: pw,
        displayName: displayName
    });
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