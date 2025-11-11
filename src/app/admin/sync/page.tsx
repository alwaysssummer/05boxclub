'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Database,
  FileText,
  AlertCircle,
  Loader2,
  Activity
} from 'lucide-react';

interface SyncStatus {
  is_syncing: boolean;
  last_sync_at: string | null;
  last_sync_type: 'full' | 'incremental' | null;
  last_sync_status: 'success' | 'error' | null;
  last_sync_error: string | null;
  total_files: number;
  total_textbooks: number;
}

interface SyncLog {
  id: string;
  type: 'full' | 'incremental';
  status: 'success' | 'error';
  started_at: string;
  completed_at: string | null;
  files_added: number;
  files_updated: number;
  files_deleted: number;
  error_message: string | null;
}

export default function AdminSyncPage() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 상태 로딩
  const loadStatus = async () => {
    try {
      const res = await fetch('/api/sync/status');
      const data = await res.json();
      
      if (data.success) {
        setStatus(data.status);
        setError(null); // 성공 시 에러 초기화
      } else {
        throw new Error(data.error || '상태 조회 실패');
      }
    } catch (err: any) {
      console.error('상태 로딩 오류:', err);
      // API 에러는 콘솔에만 표시하고 UI에는 기본 상태 표시
      setStatus({
        is_syncing: false,
        last_sync_at: null,
        last_sync_type: null,
        last_sync_status: null,
        last_sync_error: null,
        total_files: 0,
        total_textbooks: 0,
      });
    }
  };

  // 로그 로딩
  const loadLogs = async () => {
    try {
      const res = await fetch('/api/sync/logs');
      const data = await res.json();
      
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error('로그 로딩 오류:', err);
    }
  };

  // 초기 로딩
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadStatus(), loadLogs()]);
      setLoading(false);
    };
    
    init();
  }, []);

  // 자동 새로고침 (동기화 중일 때)
  useEffect(() => {
    if (status?.is_syncing) {
      const interval = setInterval(() => {
        loadStatus();
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [status?.is_syncing]);

  // 전체 동기화 실행
  const handleFullSync = async () => {
    if (!confirm('전체 동기화를 실행하시겠습니까?\n\n모든 파일을 다시 스캔하고 데이터베이스를 재구축합니다.')) {
      return;
    }

    setSyncing(true);
    setError(null);

    try {
      const res = await fetch('/api/sync/manual?type=full');
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      if (data.success) {
        const result = data.data;
        const totalChanges = (result.filesAdded || 0) + (result.filesUpdated || 0) + (result.filesDeleted || 0);
        alert('✅ 전체 동기화가 완료되었습니다!\n\n' +
              `총 ${totalChanges}개 변경사항\n` +
              `• 추가: ${result.filesAdded || 0}개\n` +
              `• 업데이트: ${result.filesUpdated || 0}개\n` +
              `• 삭제: ${result.filesDeleted || 0}개`);
        
        await Promise.all([loadStatus(), loadLogs()]);
      } else {
        throw new Error(data.message || data.error || '동기화 실패');
      }
    } catch (err: any) {
      console.error('동기화 오류:', err);
      setError(err.message);
      alert('❌ 동기화 실패: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  // 증분 동기화 실행
  const handleIncrementalSync = async () => {
    setSyncing(true);
    setError(null);

    try {
      const res = await fetch('/api/sync/manual?type=incremental');
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      if (data.success) {
        const result = data.data;
        const totalChanges = (result.filesAdded || 0) + (result.filesUpdated || 0) + (result.filesDeleted || 0);
        
        if (totalChanges === 0) {
          alert('✅ 증분 동기화가 완료되었습니다!\n\n변경사항이 없습니다.');
        } else {
          alert('✅ 증분 동기화가 완료되었습니다!\n\n' +
                `총 ${totalChanges}개 변경사항\n` +
                `• 추가: ${result.filesAdded || 0}개\n` +
                `• 업데이트: ${result.filesUpdated || 0}개\n` +
                `• 삭제: ${result.filesDeleted || 0}개`);
        }
        
        await Promise.all([loadStatus(), loadLogs()]);
      } else {
        throw new Error(data.message || data.error || '동기화 실패');
      }
    } catch (err: any) {
      console.error('동기화 오류:', err);
      setError(err.message);
      alert('❌ 동기화 실패: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">동기화 관리</h1>
        <p className="text-muted-foreground">
          Dropbox와 데이터베이스 동기화를 관리합니다
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {typeof error === 'string' ? error : JSON.stringify(error)}
          </AlertDescription>
        </Alert>
      )}

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-500" />
              총 교재
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status?.total_textbooks || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">등록된 교재 수</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-green-500" />
              총 파일
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status?.total_files || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">PDF 파일 수</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-500" />
              마지막 동기화
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {status?.last_sync_at 
                ? new Date(status.last_sync_at).toLocaleString('ko-KR')
                : '동기화 기록 없음'
              }
            </div>
            <div className="flex items-center gap-2 mt-1">
              {status?.last_sync_status === 'success' && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  성공
                </Badge>
              )}
              {status?.last_sync_status === 'error' && (
                <Badge variant="outline" className="text-red-600 border-red-600">
                  <XCircle className="h-3 w-3 mr-1" />
                  실패
                </Badge>
              )}
              {status?.last_sync_type && (
                <Badge variant="secondary" className="text-xs">
                  {status.last_sync_type === 'full' ? '전체' : '증분'}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sync Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            동기화 실행
          </CardTitle>
          <CardDescription>
            Dropbox의 파일 변경사항을 데이터베이스에 반영합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* 전체 동기화 */}
            <div className="border rounded-lg p-4 space-y-3">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-blue-500" />
                  전체 동기화
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  모든 파일을 처음부터 다시 스캔하고 데이터베이스를 재구축합니다
                </p>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1 ml-6">
                <li>• 모든 교재와 파일 재스캔</li>
                <li>• 삭제된 파일 자동 정리</li>
                <li>• 소요 시간: 3~5분</li>
              </ul>
              <Button
                onClick={handleFullSync}
                disabled={syncing || status?.is_syncing}
                className="w-full"
                variant="default"
              >
                {(syncing || status?.is_syncing) ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    동기화 중...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    전체 동기화 실행
                  </>
                )}
              </Button>
            </div>

            {/* 증분 동기화 */}
            <div className="border rounded-lg p-4 space-y-3">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-500" />
                  증분 동기화
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  마지막 동기화 이후 변경된 파일만 빠르게 업데이트합니다
                </p>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1 ml-6">
                <li>• 변경된 파일만 스캔</li>
                <li>• 빠른 업데이트</li>
                <li>• 소요 시간: 10~30초</li>
              </ul>
              <Button
                onClick={handleIncrementalSync}
                disabled={syncing || status?.is_syncing}
                className="w-full"
                variant="outline"
              >
                {(syncing || status?.is_syncing) ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    동기화 중...
                  </>
                ) : (
                  <>
                    <Activity className="h-4 w-4 mr-2" />
                    증분 동기화 실행
                  </>
                )}
              </Button>
            </div>
          </div>

          {status?.is_syncing && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                현재 동기화가 진행 중입니다. 완료될 때까지 기다려주세요...
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Sync Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            동기화 기록
          </CardTitle>
          <CardDescription>
            최근 20개의 동기화 실행 기록
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>아직 동기화 기록이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="border rounded-lg p-3 space-y-2 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {log.status === 'success' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="font-medium">
                        {log.type === 'full' ? '전체 동기화' : '증분 동기화'}
                      </span>
                      <Badge variant={log.status === 'success' ? 'outline' : 'destructive'}>
                        {log.status === 'success' ? '성공' : '실패'}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.started_at).toLocaleString('ko-KR')}
                    </span>
                  </div>

                  {log.status === 'success' && (
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>추가: {log.files_added}개</span>
                      <span>업데이트: {log.files_updated}개</span>
                      <span>삭제: {log.files_deleted}개</span>
                    </div>
                  )}

                  {log.error_message && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-3 w-3" />
                      <AlertDescription className="text-xs">
                        {log.error_message}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auto Sync Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">자동 동기화 안내</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong className="text-foreground">Vercel Cron 작업:</strong> 매 5분마다 자동으로 증분 동기화가 실행됩니다 (배포 환경)
          </p>
          <p>
            <strong className="text-foreground">Dropbox Webhook:</strong> 파일 변경 시 실시간으로 동기화가 트리거됩니다 (설정 필요)
          </p>
          <p className="text-xs">
            수동 동기화는 즉시 변경사항을 반영하고 싶을 때 사용하세요.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

