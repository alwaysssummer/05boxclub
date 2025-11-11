'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Loader2, RefreshCw, Shield } from 'lucide-react';

export default function TestTokenPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runTest = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/test-token');
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
        <h1 className="text-3xl font-bold mb-2">Dropbox 토큰 검증</h1>
        <p className="text-muted-foreground">
          현재 사용 중인 Access Token의 유효성과 타입을 확인합니다.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>토큰 테스트 실행</CardTitle>
          <CardDescription>
            토큰 존재 여부, 유효성, 권한, 타입(장기/단기)을 확인합니다.
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
                토큰 검증 시작
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
                  <strong>토큰 유효!</strong> Dropbox API에 정상적으로 연결되었습니다.
                </div>
              ) : (
                <div className="flex items-center">
                  <XCircle className="mr-2 h-5 w-5" />
                  <strong>토큰 문제 발견</strong> - {result.error}
                </div>
              )}
            </AlertDescription>
          </Alert>

          {/* 토큰 정보 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>토큰 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="font-medium">토큰 존재:</span>
                  <span>{result.tokenExists ? '✅ 설정됨' : '❌ 미설정'}</span>
                </div>
                
                {result.tokenExists && (
                  <>
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="font-medium">토큰 길이:</span>
                      <span className="font-mono">{result.tokenLength}자</span>
                    </div>
                    
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="font-medium">토큰 앞 10자:</span>
                      <span className="font-mono text-xs">{result.tokenPrefix}</span>
                    </div>
                    
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="font-medium">토큰 유효성:</span>
                      <span>{result.tokenValid ? '✅ 유효함' : '❌ 무효 또는 만료'}</span>
                    </div>
                    
                    <div className="flex items-center justify-between py-2">
                      <span className="font-medium">토큰 타입:</span>
                      <span className={`font-semibold ${
                        result.tokenType.includes('장기') ? 'text-green-600' : 
                        result.tokenType.includes('단기') ? 'text-yellow-600' : 
                        'text-red-600'
                      }`}>
                        {result.tokenType}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 계정 정보 */}
          {result.accountInfo && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Dropbox 계정 정보</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="font-medium">사용자 이름:</span>
                    <span>{result.accountInfo.name}</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="font-medium">이메일:</span>
                    <span className="font-mono text-sm">{result.accountInfo.email}</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="font-medium">계정 타입:</span>
                    <span>{result.accountInfo.accountType}</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="font-medium">계정 ID:</span>
                    <span className="font-mono text-xs">{result.accountInfo.accountId}</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <span className="font-medium">파일 접근 권한:</span>
                    <span>{result.accountInfo.fileAccess}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 권장 사항 */}
          {result.tokenType && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  권장 사항
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.tokenType.includes('장기') ? (
                  <div className="space-y-2">
                    <p className="text-green-600 font-semibold">✅ 완벽합니다!</p>
                    <p className="text-sm text-muted-foreground">
                      현재 장기 토큰(Long-lived)을 사용하고 있습니다. 이 토큰은 만료되지 않으며 계속 사용할 수 있습니다.
                    </p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside mt-2">
                      <li>토큰을 안전하게 보관하세요 (.env.local)</li>
                      <li>절대 Git에 커밋하지 마세요</li>
                      <li>프로덕션 배포 시 Vercel 환경 변수로 설정하세요</li>
                    </ul>
                  </div>
                ) : result.tokenType.includes('단기') ? (
                  <div className="space-y-2">
                    <p className="text-yellow-600 font-semibold">⚠️ 주의 필요</p>
                    <p className="text-sm text-muted-foreground">
                      현재 단기 토큰(Short-lived)을 사용하고 있습니다. 이 토큰은 약 4시간 후 만료됩니다.
                    </p>
                    <p className="text-sm font-semibold mt-2">해결 방법:</p>
                    <ol className="text-sm text-muted-foreground list-decimal list-inside">
                      <li>Dropbox App Console 접속</li>
                      <li>Settings → "Generate access token" 클릭</li>
                      <li>새 장기 토큰을 .env.local에 저장</li>
                    </ol>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-red-600 font-semibold">❌ 문제 발견</p>
                    <p className="text-sm text-muted-foreground">
                      토큰이 만료되었거나 유효하지 않습니다. 새 토큰을 발급받아야 합니다.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 원본 JSON */}
          <Card className="mt-6">
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


