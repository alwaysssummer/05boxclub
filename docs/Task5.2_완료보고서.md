# Task 5.2 완료 보고서: 교재 관리 페이지

**작업 일시**: 2025-11-11  
**작업자**: AI Assistant  
**상태**: ✅ 완료

---

## 📋 작업 개요

관리자가 교재별 상세 통계를 확인하고 활성화/비활성화를 관리할 수 있는 교재 관리 시스템을 구현했습니다.

---

## ✅ 완료된 작업

### 1. 📡 교재 목록 API

#### 파일: `src/app/api/admin/textbooks/route.ts`

**GET 엔드포인트**: `/api/admin/textbooks`

**쿼리 파라미터**:
- `sort`: 정렬 기준 (`clicks` | `name`) - 기본값: `clicks`
- `order`: 정렬 순서 (`asc` | `desc`) - 기본값: `desc`
- `search`: 검색어 (교재명 부분 일치)

**응답 예시**:
```json
{
  "success": true,
  "textbooks": [
    {
      "id": "uuid",
      "name": "중학영어",
      "description": null,
      "total_clicks": 1234,
      "is_active": true,
      "file_count": 45,
      "created_at": "2025-11-01T00:00:00Z",
      "updated_at": "2025-11-10T12:00:00Z"
    }
  ],
  "count": 10,
  "sort": { "by": "clicks", "order": "desc" }
}
```

**PUT 엔드포인트**: `/api/admin/textbooks`

**요청 바디**:
```json
{
  "id": "uuid",
  "is_active": true
}
```

**기능**:
- 교재 활성화/비활성화 토글
- 교재에 속한 모든 파일도 함께 상태 변경
- `updated_at` 자동 갱신

---

### 2. 📊 교재 상세 API

#### 파일: `src/app/api/admin/textbooks/[id]/route.ts`

**GET 엔드포인트**: `/api/admin/textbooks/[id]`

**응답 예시**:
```json
{
  "success": true,
  "textbook": {
    "id": "uuid",
    "name": "중학영어",
    "description": null,
    "total_clicks": 1234,
    "is_active": true,
    "created_at": "2025-11-01T00:00:00Z",
    "updated_at": "2025-11-10T12:00:00Z"
  },
  "files": [
    {
      "id": "uuid",
      "file_name": "현재시제.pdf",
      "file_path": "/중학영어/1학년/문법/현재시제.pdf",
      "click_count": 123,
      "is_active": true,
      "last_modified": "2025-11-01T00:00:00Z"
    }
  ],
  "dailyClicks": [
    { "date": "2025-11-01", "clicks": 45 },
    { "date": "2025-11-02", "clicks": 67 }
  ],
  "statistics": {
    "totalFiles": 45,
    "totalClicks": 1234,
    "activeFiles": 43
  }
}
```

**기능**:
- 교재 기본 정보
- 파일 목록 (클릭수 많은 순)
- 최근 30일 클릭 추이 데이터
- 통계 요약

---

### 3. 🖥️ 교재 관리 페이지

#### 파일: `src/app/admin/textbooks/page.tsx`

**URL**: `/admin/textbooks`

**주요 기능**:

1. **통계 카드 3개**
   - 전체 교재 수 (활성/비활성)
   - 전체 클릭수
   - 전체 파일 수

2. **검색 기능**
   - 교재명으로 검색
   - 실시간 필터링

3. **교재 목록 테이블**
   - 교재명
   - 클릭수 (Badge)
   - 파일 수
   - 상태 (활성/비활성 Badge)
   - 생성일
   - 작업 버튼

4. **정렬 기능**
   - 교재명 정렬 (가나다순/역순)
   - 클릭수 정렬 (많은순/적은순)
   - 헤더 클릭으로 토글

5. **활성화 관리**
   - 활성화/비활성화 토글 버튼
   - 즉시 반영

6. **상세보기**
   - 각 교재의 "상세보기" 버튼
   - 교재 상세 페이지로 이동

**UI 특징**:
- 클릭수가 많은 교재 강조
- 상태별 색상 구분 (활성: 파랑, 비활성: 회색)
- 반응형 디자인
- 로딩 상태 표시

---

### 4. 📈 교재 상세 페이지

#### 파일: `src/app/admin/textbooks/[id]/page.tsx`

**URL**: `/admin/textbooks/[id]`

**주요 기능**:

1. **헤더**
   - 뒤로가기 버튼
   - 교재명 + 상태 Badge

2. **통계 카드 3개**
   - 총 클릭수
   - 전체 파일 수 (활성/비활성)
   - 평균 클릭수 (파일당)

3. **일별 클릭 추이 그래프**
   - recharts BarChart 사용
   - 최근 30일 데이터
   - 일별 클릭수 표시
   - 호버 시 상세 정보

4. **파일 목록 테이블**
   - 순위 (TOP 3: 금/은/동 메달 🥇🥈🥉)
   - 파일명
   - 경로
   - 클릭수 (Badge)
   - 상태 (활성/비활성)
   - 최종 수정일
   - 클릭수 많은 순 정렬

**UI 특징**:
- TOP 3 파일 메달 표시
- 그래프 색상: 파랑 (#3b82f6)
- 파일 경로 말줄임 (max-w-xs truncate)
- 반응형 그래프 (ResponsiveContainer)

---

## 🎨 디자인 시스템

### 색상 구분
- **활성**: 파랑 (default)
- **비활성**: 회색 (outline)
- **클릭수 Badge**: 회색 (secondary)
- **메달**: 
  - 🥇 1위: default (파랑)
  - 🥈 2위: secondary (회색)
  - 🥉 3위: outline (테두리)

### 아이콘
- 교재: `BookOpen`
- 클릭수: `Eye`
- 파일: `FileText`
- 추이: `TrendingUp`
- 정렬: `ArrowUpDown`
- 검색: `Search`
- 뒤로가기: `ArrowLeft`

---

## 🔄 수정된 파일

### `src/app/admin/layout.tsx`

**변경사항**:
- 교재 관리 메뉴 상태: `pending` → `ready`
- 요청 관리 메뉴 상태: `pending` → `ready`
- 공지사항 메뉴 상태: `pending` → `ready`
- 통계 분석 메뉴 상태: `pending` → `ready`

---

## 📦 생성된 파일 목록

```
src/
├── app/
│   ├── api/
│   │   └── admin/
│   │       └── textbooks/
│   │           ├── route.ts           # 교재 목록 API
│   │           └── [id]/
│   │               └── route.ts       # 교재 상세 API
│   └── admin/
│       └── textbooks/
│           ├── page.tsx               # 교재 목록 페이지
│           └── [id]/
│               └── page.tsx           # 교재 상세 페이지

docs/
└── Task5.2_완료보고서.md              # 이 문서
```

**파일 개수**: 5개

---

## 🧪 테스트 시나리오

### 1. 교재 목록 페이지

```
1. /admin/textbooks 접속
2. 통계 카드 확인 (전체 교재 수, 클릭수, 파일 수)
3. 검색창에 "중학" 입력 → 해당 교재만 표시 확인
4. "교재명" 헤더 클릭 → 가나다순 정렬 확인
5. "클릭수" 헤더 클릭 → 많은순 정렬 확인
6. 교재 하나 선택 → "비활성화" 버튼 클릭
7. 상태 Badge가 "비활성"으로 변경 확인
8. "상세보기" 버튼 클릭 → 상세 페이지 이동
```

### 2. 교재 상세 페이지

```
1. /admin/textbooks/[id] 접속
2. 교재명과 상태 Badge 표시 확인
3. 통계 카드 3개 확인 (총 클릭수, 파일 수, 평균)
4. 일별 클릭 추이 그래프 렌더링 확인
5. 그래프 바에 호버 → 툴팁 표시 확인
6. 파일 목록 테이블 확인
7. TOP 3 파일 메달 표시 확인
8. 뒤로가기 버튼 클릭 → 목록 페이지 복귀
```

### 3. 정렬 및 검색

```
1. 교재명 가나다순 정렬
2. 교재명 역순 정렬
3. 클릭수 많은순 정렬
4. 클릭수 적은순 정렬
5. 검색어 입력 → 즉시 필터링 확인
6. 검색어 지우기 → 전체 목록 복원
```

### 4. 활성화 관리

```
1. 활성 교재 → "비활성화" 클릭
2. API 호출 확인 (Network 탭)
3. 상태 즉시 변경 확인
4. 비활성 교재 → "활성화" 클릭
5. 상태 변경 확인
6. Supabase에서 파일 테이블 확인 (is_active 연동)
```

---

## 📊 API 응답 시간

예상 성능 (100개 교재 기준):

| API | 예상 시간 | 비고 |
|-----|----------|------|
| GET /api/admin/textbooks | 200-500ms | 파일 수 계산 포함 |
| GET /api/admin/textbooks/[id] | 300-800ms | 그래프 데이터 포함 |
| PUT /api/admin/textbooks | 100-300ms | 활성화 토글 |

---

## 🎯 완료 기준 체크

- ✅ 교재 목록 API 구현
- ✅ 교재 상세 API 구현
- ✅ 교재 목록 페이지 UI 완성
- ✅ 교재 상세 페이지 UI 완성
- ✅ 정렬 기능 작동 (교재명/클릭수)
- ✅ 검색 기능 작동
- ✅ 활성화/비활성화 토글 작동
- ✅ 일별 클릭 추이 그래프 표시
- ✅ 파일 목록 표시 (TOP 3 메달)
- ✅ 린트 에러 0개
- ⏳ Vercel 배포 후 테스트 (다음 단계)

---

## 🔜 다음 단계

### Phase 6: 관리자 인증 시스템

이제 관리자 페이지가 완성되었으므로, 다음 단계는 보안 강화입니다:

1. **Task 6.1**: Supabase Auth 연동
   - 로그인 페이지 구현
   - 인증 미들웨어
   - API 라우트 보호
   - 로그아웃 기능

---

## 📝 주의사항

### 1. 일별 클릭 추이 데이터

현재는 `file_clicks` 테이블을 직접 쿼리하여 날짜별 그룹화를 수행합니다. 성능 개선을 위해 Supabase 함수를 생성할 수 있습니다:

```sql
CREATE OR REPLACE FUNCTION get_textbook_daily_clicks(textbook_id_param UUID)
RETURNS TABLE (date DATE, clicks BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(fc.clicked_at) as date,
    COUNT(*)::BIGINT as clicks
  FROM file_clicks fc
  JOIN files f ON f.id = fc.file_id
  WHERE f.textbook_id = textbook_id_param
    AND fc.clicked_at >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY DATE(fc.clicked_at)
  ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql;
```

### 2. 파일 수 계산

현재는 각 교재마다 별도 쿼리로 파일 수를 계산합니다. 교재가 많아지면 성능 문제가 있을 수 있으므로 JOIN 쿼리로 최적화 가능합니다.

### 3. 권한 체크

현재는 TODO 주석으로 남겨둔 상태입니다. Phase 6에서 Supabase Auth를 연동하여 관리자 권한 체크를 구현해야 합니다.

---

## 🎉 Task 5.2 완료!

**다음 작업**: Phase 6 - 관리자 인증 시스템 구현

**테스트 URL**: 
- http://localhost:3000/admin/textbooks (목록)
- http://localhost:3000/admin/textbooks/[id] (상세)

**관련 문서**:
- [개발 계획 플랜](개발_계획_플랜.md)
- [Task 5.1 완료 보고서](Task5.1_완료보고서.md)

---

**작성일**: 2025-11-11  
**최종 업데이트**: 2025-11-11





