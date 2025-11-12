// 파일 트리에서 특정 교재 검색
const fs = require('fs');

const data = JSON.parse(fs.readFileSync('c:\\Users\\user\\.cursor\\projects\\d-DEV-cursor-eng-lib\\agent-tools\\ed5782cc-f374-40b5-8e7f-24766159cdfa.txt', 'utf8').split('\n').slice(7, -3).join('\n'));

const textbook = data.data.find(t => t.name === '공영2_동아(이)');

if (textbook) {
  console.log(`교재: ${textbook.name}`);
  console.log(`파일 개수: ${textbook.fileCount}`);
  console.log(`Children:`, JSON.stringify(textbook.children, null, 2));
} else {
  console.log('교재를 찾을 수 없습니다.');
}

