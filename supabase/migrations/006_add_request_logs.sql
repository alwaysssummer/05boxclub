-- 교재 요청 로그 테이블 생성 (24시간 내 5회 제한 추적용)
CREATE TABLE IF NOT EXISTS textbook_request_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  textbook_name TEXT NOT NULL,
  user_ip TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성 (빠른 조회를 위해)
CREATE INDEX IF NOT EXISTS idx_request_logs_textbook_ip_created 
ON textbook_request_logs(textbook_name, user_ip, created_at DESC);

-- 24시간 이상 된 로그 자동 삭제 함수 (선택사항)
CREATE OR REPLACE FUNCTION delete_old_request_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM textbook_request_logs
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- 주석
COMMENT ON TABLE textbook_request_logs IS '교재 요청 로그 (24시간 내 5회 제한 추적용)';
COMMENT ON COLUMN textbook_request_logs.textbook_name IS '요청한 교재명';
COMMENT ON COLUMN textbook_request_logs.user_ip IS '요청자 IP (익명화)';
COMMENT ON COLUMN textbook_request_logs.created_at IS '요청 시각';

