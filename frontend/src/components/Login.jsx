import { useState } from "react";
import "./styles/Login.scss"
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
            <div className="auth-header">
                <h2>로그인</h2>
            </div>
            <div className="auth-inputs">
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
            </div>
            <div className="button">
                <button type="submit">로그인</button>
            </div>
            {err && (
                <div className="auth-error">
                    <p className="error">{err}</p>
                </div>
            )}
        </form>
    );
}