-- 공영2_동아(이) 교재의 모든 파일 확인
SELECT 
  f.name,
  f.dropbox_path,
  f.is_active,
  f.last_modified,
  t.name as textbook_name
FROM files f
JOIN textbooks t ON f.textbook_id = t.id
WHERE t.name LIKE '%동아%'
  AND f.dropbox_path LIKE '%문장분석%'
ORDER BY f.name;

-- 특정 파일명으로 검색
SELECT 
  name,
  dropbox_path,
  is_active,
  last_modified
FROM files
WHERE name IN ('한줄영어.pdf', '좌우한줄.pdf', '문장분석 A.pdf', '문장분석 B.pdf')
ORDER BY name;

