import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import axios from 'axios';
// 1. PostCreate와 동일한 스타일을 재사용합니다.
import './style/PostCreate.scss';

export default function PostEdit() {
  const { id } = useParams(); // URL에서 게시물 ID 가져오기
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null); // 새로 선택된 파일
  const [preview, setPreview] = useState(null); // 이미지 미리보기 URL
  const [existingImageKey, setExistingImageKey] = useState(null); // 기존 S3 키

  const [loading, setLoading] = useState(true); // 처음엔 데이터 로딩
  const [error, setError] = useState(null);

  // 1. 처음 마운트 시 기존 게시물 데이터를 불러옵니다.
useEffect(() => {
    const fetchPost = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/api/posts/${id}`);
            const post = response.data;

            setTitle(post.title);
            setContent(post.content);

            // --- 백엔드 수정 사항 반영 ---
            // 1. 표시용 URL 설정
            if (post.presignedImageUrl) {
            setPreview(post.presignedImageUrl);
            }
            
            // 2. 기존 S3 키 저장 (이미지 변경 안 할 경우 대비)
            // 백엔드는 이제 원본 키를 imageUrl 또는 fileUrl[0]에 보냅니다.
            const originalKey = post.imageUrl || (post.fileUrl && post.fileUrl[0]);
            if (originalKey) {
            setExistingImageKey(originalKey);
            }
            // --- ---

        } catch (err) {
            console.error("게시물 로딩 실패:", err);
            setError("게시물을 불러오는 데 실패했습니다.");
        } finally {
            setLoading(false);
        }
        };
        fetchPost();
    }, [id]);

    // 2. 파일 선택 핸들러 (PostCreate와 동일)
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
        setFile(selectedFile);
        const previewUrl = URL.createObjectURL(selectedFile);
        setPreview(previewUrl);
        }
    };

    // 3. 폼 제출 핸들러
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        let finalFileKey = existingImageKey; // 1. 일단 기존 키로 설정

        try {
        // 2. 새 파일이 선택된 경우, S3에 먼저 업로드
        if (file) {
            // 2-1. S3 업로드용 URL 요청
            const uploadConfig = await api.get('/api/upload', {
            params: {
                filename: file.name,
                contentType: file.type,
            },
            });

            const { url: presignedUrl, key: fileKey } = uploadConfig.data;
            
            // 2-2. S3에 업로드
            await axios.put(presignedUrl, file, {
            headers: { 'Content-Type': file.type },
            });

            finalFileKey = fileKey; // 2-3. S3 키를 새 키로 교체
        }

        // 3. 백엔드에 수정된 데이터 전송 (POST 대신 PUT)
        const postData = {
            title,
            content,
            fileUrl: finalFileKey ? [finalFileKey] : [],
            imageUrl: finalFileKey || null,
        };

        await api.put(`/api/posts/${id}`, postData); // 👈 PUT 요청

        // 4. 성공 시 상세 페이지로 이동
        navigate(`/post/${id}`);

        } catch (err) {
        console.error('게시물 수정 실패:', err);
        setError('게시물 수정 중 오류가 발생했습니다.');
        setLoading(false);
        }
    };

    // --- 렌더링 ---
    if (loading && !title) {
        // (데이터 로딩 중일 때)
        return <div style={{ padding: 24 }}>게시물 정보를 불러오는 중... ⏳</div>;
    }
    if (error && !title) {
        // (데이터 로딩 실패 시)
        return <div style={{ padding: 24, color: "crimson" }}>⚠️ {error}</div>;
    }

    return (
        <div className="post-create-container">
        <form onSubmit={handleSubmit} className="post-create-form">
            <h1>FoodTrail 수정하기 ✏️</h1>

            {/* 제목 */}
            <div className="form-group">
            <label htmlFor="title">제목</label>
            <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
            />
            </div>

            {/* 내용 */}
            <div className="form-group">
            <label htmlFor="content">내용</label>
            <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                disabled={loading}
            />
            </div>

            {/* 파일 업로드 */}
            <div className="form-group">
            <label htmlFor="file">대표 이미지 (변경 시 선택)</label>
            <input
                id="file"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={loading}
            />
            </div>

            {/* 미리보기 */}
            {preview && (
            <div className="preview-container">
                <img src={preview} alt="미리보기" />
            </div>
            )}

            {/* 에러 메시지 */}
            {error && <p className="error-message">{error}</p>}

            {/* 버튼 */}
            <div className="form-actions">
            <button
                type="button"
                className="btn-cancel"
                onClick={() => navigate(-1)} // 뒤로가기
                disabled={loading}
            >
                취소
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? '수정 중...' : '수정하기'}
            </button>
            </div>
        </form>
        </div>
    );
}

