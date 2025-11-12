// 드롭박스 특정 폴더의 파일 목록 확인
const { getDropboxClientAsync } = require('./src/lib/dropbox/client');

async function checkFolder() {
  const dbx = await getDropboxClientAsync();
  
  const folderPath = '/05boxAPP/공영2_동아(이)/1과/문장분석';
  
  console.log(`\n=== 드롭박스 폴더 확인: ${folderPath} ===\n`);
  
  const response = await dbx.filesListFolder({
    path: folderPath,
    recursive: false,
  });
  
  console.log(`총 ${response.result.entries.length}개 항목 발견:\n`);
  
  response.result.entries.forEach((entry, index) => {
    console.log(`${index + 1}. ${entry['.tag']}: ${entry.name}`);
    if (entry['.tag'] === 'file') {
      console.log(`   - 경로: ${entry.path_display}`);
      console.log(`   - 소문자: ${entry.path_lower}`);
      console.log(`   - 크기: ${entry.size} bytes`);
      console.log(`   - 수정: ${entry.server_modified}`);
    }
    console.log('');
  });
}

checkFolder().catch(console.error);

