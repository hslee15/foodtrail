import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './style/UserManagement.scss';
import api from '../api/client';

function UserManagement({ user, onLogout }) {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('전체');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updatingUsers, setUpdatingUsers] = useState(new Set());
    const [updateError, setUpdateError] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await api.get('/api/admin/users');
                setUsers(response.data);
                setFilteredUsers(response.data);
            } catch (err) {
                console.error("사용자 로드 실패:", err);
                setError(err?.response?.data?.message || "사용자 목록 로드 실패");
            } finally {
                setLoading(false);
            }
        };

        if (user && user.role === 'admin') {
            fetchUsers();
        }
    }, [user]);

    useEffect(() => {
        let filtered = users;

        if (searchTerm) {
            const lowerCaseSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(u => {
                const emailMatch = u.email && u.email.toLowerCase().includes(lowerCaseSearch);
                const nameMatch = u.displayName && u.displayName.toLowerCase().includes(lowerCaseSearch);
                return emailMatch || nameMatch;
            });
        }

        if (statusFilter !== '전체') {
            if (statusFilter === '활성') {
                filtered = filtered.filter(u => u.isActive === true);
            } else if (statusFilter === '비활성') {
                filtered = filtered.filter(u => u.isActive === false);
            }
        }

        setFilteredUsers(filtered);
    }, [searchTerm, statusFilter, users]);

    const handleToggleActive = async (userId, currentStatus) => {
        if (updatingUsers.has(userId)) return;

        setUpdatingUsers(prev => new Set(prev).add(userId));
        setUpdateError(null);

        try {
            const newStatus = !currentStatus;
            const response = await api.patch(`/api/admin/users/${userId}/active`, {
                isActive: newStatus
            });

            setUsers(prevUsers =>
                prevUsers.map(u =>
                    u._id === userId ? { ...u, isActive: newStatus } : u
                )
            );

            console.log(response.data.message);
        } catch (err) {
            console.error("사용자 상태 변경 실패:", err);
            setUpdateError(err?.response?.data?.message || "상태 변경에 실패했습니다.");
        } finally {
            setUpdatingUsers(prev => {
                const next = new Set(prev);
                next.delete(userId);
                return next;
            });
        }
    };

    if (!user || user.role !== 'admin') {
        return (
            <div className="main-container">
                <div className="error-message">
                    접근 권한이 없습니다. 관리자만 접근할 수 있습니다.
                </div>
            </div>
        );
    }

    return (
        <div className="main-container">
            <header className="main-header">
                <h1>FoodTrail</h1>
                <div className="user-info">
                    <span>{user?.displayName || user?.email}님 (관리자)</span>
                    <button onClick={onLogout} className="logout-button">
                        로그아웃
                    </button>
                </div>
            </header>

            <main className="content-area">
                <div className="page-header">
                    <h2>사용자 관리 👥</h2>
                    <Link to="/" className="btn-back">
                        ← 대시보드로
                    </Link>
                </div>

                <div className="search-container">
                    <input
                        type="text"
                        placeholder="이메일, 이름으로 검색..."
                        className="search-bar"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="filter-controls">
                    <div className="status-filter-container">
                        <label htmlFor="statusFilter">상태:</label>
                        <select
                            id="statusFilter"
                            className="status-filter-select"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="전체">전체</option>
                            <option value="활성">활성</option>
                            <option value="비활성">비활성</option>
                        </select>
                    </div>
                </div>

                {loading && <p>사용자 목록을 불러오는 중... ⏳</p>}
                {error && <p className="error-message" style={{ color: "crimson" }}>{error}</p>}
                {updateError && <p className="error-message" style={{ color: "crimson" }}>{updateError}</p>}

                <div className="users-table-container">
                    {!loading && !error && filteredUsers.length > 0 ? (
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>이메일</th>
                                    <th>이름</th>
                                    <th>역할</th>
                                    <th>상태</th>
                                    <th>가입일</th>
                                    <th>작업</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(u => (
                                    <tr key={u._id} className={!u.isActive ? 'inactive-user' : ''}>
                                        <td>{u.email}</td>
                                        <td>{u.displayName || '-'}</td>
                                        <td>
                                            <span className={`role-badge ${u.role === 'admin' ? 'admin' : 'user'}`}>
                                                {u.role === 'admin' ? '관리자' : '사용자'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${u.isActive ? 'active' : 'inactive'}`}>
                                                {u.isActive ? '활성' : '비활성'}
                                            </span>
                                        </td>
                                        <td>{new Date(u.createdAt).toLocaleDateString('ko-KR')}</td>
                                        <td>
                                            <button
                                                className={`btn-toggle ${u.isActive ? 'btn-deactivate' : 'btn-activate'}`}
                                                onClick={() => handleToggleActive(u._id, u.isActive)}
                                                disabled={updatingUsers.has(u._id)}
                                            >
                                                {updatingUsers.has(u._id)
                                                    ? '처리 중...'
                                                    : u.isActive
                                                    ? '비활성화'
                                                    : '활성화'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        !loading && !error && (
                            <p className="no-results">
                                {searchTerm || statusFilter !== '전체'
                                    ? '검색 결과가 없습니다.'
                                    : '등록된 사용자가 없습니다.'}
                            </p>
                        )
                    )}
                </div>
            </main>
        </div>
    );
}

export default UserManagement;

