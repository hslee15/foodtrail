import { useState } from "react";
import "../components/style/AuthLogin.scss";
import { loginApi } from "../api/auth";

export default function Login({ onSuccess }) {
    const [email, setEmail] = useState("");
    const [pw, setPw] = useState("");
    const [err, setErr] = useState("");

    const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
    const { token, user } = await loginApi(email, pw);
    localStorage.setItem("token", token);
    if (onSuccess) onSuccess(user);
    } catch (e) {
    setErr(e?.response?.data?.message ?? "로그인 실패");
    }
};

return (
    <form className="auth-form" onSubmit={submit}>
    <h2>로그인</h2>
    <input
        type="email"
        placeholder="이메일"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
    />
    <input
        type="password"
        placeholder="비밀번호"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
    />
    <button type="submit">로그인</button>
    {err && <p className="error">{err}</p>}
    </form>
    );
}