'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';

export default function TestDropboxConnectionPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runTest = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/test-dropbox-connection');
      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dropbox 연결 테스트</h1>
        <p className="text-muted-foreground">
          Dropbox API 연결 상태를 확인하고 문제를 진단합니다.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>테스트 실행</CardTitle>
          <CardDescription>
            Dropbox Access Token, 경로 접근, 파일 목록 조회, 임시 링크 생성을 테스트합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={runTest} disabled={loading} size="lg">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                테스트 실행 중...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                테스트 시작
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <>
          {/* 요약 */}
          <Alert variant={result.success ? 'default' : 'destructive'} className="mb-6">
            <AlertDescription>
              {result.success ? (
                <div className="flex items-center">
                  <CheckCircle2 className="mr-2 h-5 w-5 text-green-600" />
                  <strong>모든 테스트 통과!</strong> Dropbox 연결이 정상적으로 작동합니다.
                </div>
              ) : (
                <div className="flex items-center">
                  <XCircle className="mr-2 h-5 w-5" />
                  <strong>테스트 실패</strong> - 아래 상세 내역을 확인하세요.
                </div>
              )}
            </AlertDescription>
          </Alert>

          {/* 통과/실패 항목 */}
          {result.summary && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>테스트 결과 요약</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.summary.passed?.map((item: string, idx: number) => (
                    <div key={idx} className="flex items-center text-green-600">
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {item}
                    </div>
                  ))}
                  {result.summary.failed?.map((item: string, idx: number) => (
                    <div key={idx} className="flex items-center text-red-600">
                      <XCircle className="mr-2 h-4 w-4" />
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 상세 정보 */}
          {result.tests && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>상세 정보</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Access Token */}
                  <div>
                    <h3 className="font-semibold mb-1">Access Token</h3>
                    <p className="text-sm text-muted-foreground">
                      {result.tests.details.tokenPrefix || '❌ 설정되지 않음'}
                    </p>
                  </div>

                  {/* Root Path */}
                  <div>
                    <h3 className="font-semibold mb-1">Root Path</h3>
                    <p className="text-sm text-muted-foreground">
                      {result.tests.details.rootPath || '/'}
                    </p>
                  </div>

                  {/* 파일 통계 */}
                  {result.tests.details.totalEntries !== undefined && (
                    <div>
                      <h3 className="font-semibold mb-1">파일 통계</h3>
                      <ul className="text-sm text-muted-foreground list-disc list-inside">
                        <li>전체 항목: {result.tests.details.totalEntries}개</li>
                        <li>PDF 파일: {result.tests.details.pdfFiles}개</li>
                      </ul>
                    </div>
                  )}

                  {/* 샘플 PDF 파일 */}
                  {result.tests.details.samplePdfFiles && result.tests.details.samplePdfFiles.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-1">샘플 PDF 파일</h3>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {result.tests.details.samplePdfFiles.map((file: any, idx: number) => (
                          <li key={idx} className="font-mono text-xs">
                            📄 {file.name} ({Math.round(file.size / 1024)} KB)
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 임시 링크 테스트 */}
                  {result.tests.details.temporaryLinkTest && (
                    <div>
                      <h3 className="font-semibold mb-1">임시 링크 생성 테스트</h3>
                      <p className="text-sm text-muted-foreground">
                        ✅ {result.tests.details.temporaryLinkTest.file}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono mt-1">
                        {result.tests.details.temporaryLinkTest.linkPrefix}
                      </p>
                    </div>
                  )}

                  {/* 에러 목록 */}
                  {result.tests.errors && result.tests.errors.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-1 text-red-600">오류</h3>
                      <ul className="text-sm space-y-1">
                        {result.tests.errors.map((error: string, idx: number) => (
                          <li key={idx} className="text-red-600 font-mono text-xs">
                            • {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 원본 JSON */}
          <Card>
            <CardHeader>
              <CardTitle>원본 응답 (JSON)</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}


