-- 카테고리 테이블 생성
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📚',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- textbooks 테이블에 category_id 컬럼 추가
ALTER TABLE textbooks 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_textbooks_category_id ON textbooks(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

-- 기본 카테고리 추가
INSERT INTO categories (name, icon, display_order) VALUES
  ('교과서', '📚', 1),
  ('모의고사', '🗓️', 2),
  ('기타', '📖', 3)
ON CONFLICT DO NOTHING;

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_categories_updated_at();

