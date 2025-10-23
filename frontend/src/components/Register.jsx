import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./styles/Register.scss";
import { registerApi } from "../api/auth";

function Register() {
    const [email, setEmail] = useState("");
    const [pw, setPw] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [err, setErr] = useState("");
    const navigate = useNavigate();

    const submit = async (e) => {
        e.preventDefault();
        setErr("");
        try {
        const res = await registerApi(email, pw, displayName);
        alert("회원가입이 완료되었습니다!");
        localStorage.setItem("email", res?.email || email);
        localStorage.setItem("displayName", res?.displayName || displayName);
        navigate("/login");
        } catch (e) {
        setErr(e?.response?.data?.message ?? "회원가입 실패");
        }
    };

    return (
        <form className="auth-form" onSubmit={submit}>
        <div className="auth-header">
            <h2>회원가입</h2>
        </div>
        <div className="auth-inputs">
            <input
            type="text"
            placeholder="닉네임"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            />
            <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            />
            <input
            type="password"
            placeholder="비밀번호"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            minLength={3}
            required
            />
        </div>

        <div className="button">
            <button type="submit">회원가입</button>
            <button type="button" onClick={() => navigate("/login")}>로그인으로</button>
        </div>

        {err && (
            <div className="auth-error">
            <p className="error">{err}</p>
            </div>
        )}
        </form>
    );
}

export default Register;