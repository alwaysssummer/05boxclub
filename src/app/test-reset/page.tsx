'use client';

import { useState } from 'react';

export default function TestResetPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!confirm('정말로 모든 데이터를 삭제하시겠습니까?')) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/reset-data', {
        method: 'DELETE',
      });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sync/manual?type=full');
      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">🔄 데이터 초기화 & 재동기화</h1>
      
      <div className="space-y-4">
        <button
          onClick={handleReset}
          disabled={loading}
          className="px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? '처리 중...' : '1️⃣ 모든 데이터 삭제'}
        </button>

        <button
          onClick={handleSync}
          disabled={loading}
          className="ml-4 px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '처리 중...' : '2️⃣ 전체 동기화 실행'}
        </button>
      </div>

      {result && (
        <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded">
          <h2 className="text-xl font-semibold mb-2">결과:</h2>
          <pre className="overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}


