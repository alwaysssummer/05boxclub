-- 한글로만 이루어진 파일명 찾기 (띄어쓰기, 영문, 숫자 없음)
-- 파일명에서 .pdf 제거하고 순수 한글만 있는지 체크

SELECT 
  name,
  dropbox_path,
  is_active,
  REGEXP_REPLACE(name, '\.pdf$', '', 'i') as name_without_ext
FROM files
WHERE 
  is_active = true
  AND name LIKE '%한줄%' OR name LIKE '%좌우%'
ORDER BY name;

-- 전체 파일 통계
SELECT 
  '전체 활성 파일' as category,
  COUNT(*) as count
FROM files
WHERE is_active = true
UNION ALL
SELECT 
  '파일명에 영문/숫자 포함',
  COUNT(*)
FROM files
WHERE is_active = true
  AND (name ~ '[A-Za-z0-9]')
UNION ALL
SELECT 
  '파일명에 영문/숫자 없음 (순수 한글+특수문자)',
  COUNT(*)
FROM files
WHERE is_active = true
  AND NOT (name ~ '[A-Za-z0-9]');

