import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import './style/PostCreate.scss'; // 2단계에서 만들 SCSS 파일
import axios from 'axios'; // S3에 직접 업로드하기 위해 axios import
import StarRatingInput from '../components/StarRatingInput';

export default function PostCreate() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null); // 업로드할 파일 객체
  const [preview, setPreview] = useState(null); // 이미지 미리보기 URL
  const [rating, setRating] = useState(0)
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // 1. 파일 선택 시 핸들러
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      // 미리보기 URL 생성
      const previewUrl = URL.createObjectURL(selectedFile);
      setPreview(previewUrl);
    }
  };

  // 2. 폼 제출 시 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !content) {
      setError('제목과 내용을 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    
    let uploadedFileKey = null; // S3에 저장된 파일 키 (예: uploads/...)

    try {
      // --- 3. (파일이 있는 경우) S3에 먼저 업로드 ---
      if (file) {
        // 3-1. 백엔드에 S3 업로드용 임시 URL(Presigned URL) 요청
        // (이 요청을 받을 /api/upload 라우터는 3단계에서 만듭니다)
        const uploadConfig = await api.get('/api/upload', {
          params: {
            filename: file.name,
            contentType: file.type,
          },
        });

        const { url: presignedUrl, key: fileKey } = uploadConfig.data;
        uploadedFileKey = fileKey; // S3 키 저장

        // 3-2. 받아온 URL로 실제 파일 업로드 (Axios 사용)
        // 🚨 주의: 여긴 'api.put'이 아니라 'axios.put'입니다.
        // S3 URL에는 우리 백엔드의 Auth 토큰이 필요 없습니다.
        await axios.put(presignedUrl, file, {
          headers: {
            'Content-Type': file.type,
          },
        });
      }

      // --- 4. 백엔드에 게시물 정보 저장 요청 ---
      const postData = {
        title,
        content,
        rating,
        // S3 키가 있으면 fileUrl과 imageUrl에 넣어줍니다.
        fileUrl: uploadedFileKey ? [uploadedFileKey] : [],
        imageUrl: uploadedFileKey || null,
      };

      // /api/posts 로 최종 데이터 전송
      await api.post('/api/posts', postData);

      // --- 5. 성공 시 홈으로 이동 ---
      navigate('/');

    } catch (err) {
      console.error('게시물 등록 실패:', err);
      setError('게시물 등록 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  return (
    <div className="post-create-container">
      <form onSubmit={handleSubmit} className="post-create-form">
        <h1>새 FoodTrail 작성 ✍️</h1>

        {/* 제목 입력 */}
        <div className="form-group">
          <label htmlFor="title">제목 (식당 이름)</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="맛집 이름, 메뉴 등"
            disabled={loading}
          />
        </div>

        {/* [추가] 별점 입력 */}
        <div className="form-group">
          <label>별점</label>
          <StarRatingInput
            rating={rating}
            onRatingChange={setRating}
            disabled={loading}
          />
        </div>

        {/* 내용 입력 */}
        <div className="form-group">
          <label htmlFor="content">내용</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="방문 후기, 팁 등을 적어주세요."
            rows={10}
            disabled={loading}
          />
        </div>

        {/* 파일 업로드 */}
        <div className="form-group">
          <label htmlFor="file">대표 이미지</label>
          <input
            id="file"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={loading}
          />
        </div>
        

        {/* 이미지 미리보기 */}
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
            {loading ? '등록 중...' : '등록하기'}
          </button>
        </div>
      </form>
    </div>
  );
}