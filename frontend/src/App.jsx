import { useState, useEffect } from 'react';
import './App.scss';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './pages/Dashboard';
import PostDetail from './pages/PostDetail';
import Landing from './pages/Landing';
import PostCreate from './pages/PostCreate';
import api from './api/client';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PostEdit from './pages/PostEdit';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get('/api/auth/me');
          setUser(response.data);
        } catch (error) {
          console.error("토큰 검증 실패:", error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, []); 

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return <div>로딩 중...</div>;
  }

  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          {user ? (
            <>
              <Route path="/" element={<Dashboard user={user} onLogout={handleLogout} />} />
              <Route path="/post/:id" element={<PostDetail user={user}/>} />
              <Route path='/create' element={<PostCreate/>}/>
              <Route path='/post/:id/edit' element={<PostEdit/>}/>
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="/register" element={<Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            <>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login onSuccess={handleLoginSuccess} />} />
              <Route path="/register" element={<Register />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;