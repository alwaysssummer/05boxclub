'use client';

import { useEffect, useState } from 'react';

interface SyncLog {
  id: string;
  sync_type: string;
  sync_path: string;
  status: string;
  result_data: any;
  created_at: string;
}

export default function TestLogsPage() {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [fileCount, setFileCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // 동기화 로그 가져오기
        const logsRes = await fetch('/api/test-logs');
        const logsData = await logsRes.json();
        
        if (logsData.success) {
          setLogs(logsData.logs || []);
          setFileCount(logsData.fileCount || 0);
        }
      } catch (error) {
        console.error('데이터 로딩 오류:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-4">📋 동기화 로그</h1>
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">📋 동기화 로그 및 파일 현황</h1>
      
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">📊 통계</h2>
        <p className="text-lg">
          <strong>데이터베이스에 저장된 파일 수:</strong> {fileCount}개
        </p>
      </div>

      <h2 className="text-2xl font-semibold mb-4">최근 동기화 기록 (최대 10개)</h2>
      
      {logs.length === 0 ? (
        <p className="text-gray-500">동기화 로그가 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <div
              key={log.id}
              className={`p-4 rounded-lg border ${
                log.status === 'success'
                  ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                      log.status === 'success'
                        ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                        : 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200'
                    }`}
                  >
                    {log.status}
                  </span>
                  <span className="ml-2 text-sm font-medium">{log.sync_type}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(log.created_at).toLocaleString('ko-KR')}
                </span>
              </div>
              
              <p className="text-sm mb-2">
                <strong>경로:</strong> {log.sync_path || '/'}
              </p>
              
              {log.result_data && (
                <div className="mt-2 p-2 bg-white dark:bg-gray-900 rounded text-xs">
                  <strong>결과:</strong>
                  <pre className="mt-1 overflow-x-auto">
                    {JSON.stringify(log.result_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          🔄 새로고침
        </button>
      </div>
    </div>
  );
}




