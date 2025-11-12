-- textbooks 테이블에 display_order 컬럼 추가
ALTER TABLE textbooks 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- 기존 데이터에 display_order 설정 (카테고리별로 순서 부여)
WITH ranked_textbooks AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY name) as rn
  FROM textbooks
)
UPDATE textbooks 
SET display_order = ranked_textbooks.rn
FROM ranked_textbooks
WHERE textbooks.id = ranked_textbooks.id;

-- 인덱스 추가 (카테고리별 정렬 성능 향상)
CREATE INDEX IF NOT EXISTS idx_textbooks_category_order 
ON textbooks(category_id, display_order);

-- 코멘트 추가
COMMENT ON COLUMN textbooks.display_order IS '카테고리 내 교재 표시 순서 (작을수록 위에 표시)';

