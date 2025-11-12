'use client';

import { useState, useEffect } from 'react';
import { useFile } from '@/contexts/FileContext';
import { Button } from '@/components/ui/button';
import { 
  FileQuestion, 
  Download, 
  Loader2,
  AlertCircle,
  ArrowLeft,
  FileText,
  X
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function PDFViewer() {
  const { selectedFile, clearFile } = useFile();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [pdfLoadSuccess, setPdfLoadSuccess] = useState(false);

  // 파일 선택 시 PDF URL 가져오기
  useEffect(() => {
    if (!selectedFile) {
      setPdfUrl(null);
      setError(null);
      setPdfLoadSuccess(false);
      return;
    }

    loadPDF();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFile]);

  const loadPDF = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);
    setPdfLoadSuccess(false);

    try {
      // Proxy API를 통해 PDF 미리보기 (CORS 우회)
      const previewUrl = `/api/files/proxy?fileId=${selectedFile.id}`;
      
      // 미리 응답 확인
      const testResponse = await fetch(previewUrl);
      if (!testResponse.ok) {
        const errorData = await testResponse.json().catch(() => null);
        if (errorData?.error?.includes('Access Token')) {
          setError('Dropbox 연동이 필요합니다. 관리자에게 문의하세요.');
        } else {
          setError(errorData?.error || '파일을 불러올 수 없습니다.');
        }
        setPdfLoadSuccess(false);
        setLoading(false);
        return;
      }
      
      setPdfUrl(previewUrl);
      console.log('[PDFViewer] PDF 로드 성공 (Proxy 사용):', selectedFile.name);
    } catch (err) {
      console.error('[PDFViewer] 로딩 오류:', err);
      setError('파일을 불러오는 중 네트워크 오류가 발생했습니다.');
      setPdfLoadSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedFile) return;

    setDownloading(true);
    try {
      // Proxy API를 통해 다운로드 (download=true 파라미터)
      const downloadUrl = `/api/files/proxy?fileId=${selectedFile.id}&download=true`;
      
      // Blob을 통해 올바른 파일명으로 다운로드
      const response = await fetch(downloadUrl);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        if (errorData?.error?.includes('Access Token')) {
          setError('Dropbox 연동이 필요합니다. 관리자에게 문의하세요.');
        } else {
          setError(errorData?.error || '파일 다운로드에 실패했습니다.');
        }
        setDownloading(false);
        return;
      }
      
      const blob = await response.blob();
      
      // Blob URL 생성
      const blobUrl = window.URL.createObjectURL(blob);
      
      // a 태그로 다운로드 (파일명 지정)
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = selectedFile.name; // 올바른 파일명 지정
      document.body.appendChild(link);
      link.click();
      
      // 정리
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
      console.log('[PDFViewer] 다운로드 완료:', selectedFile.name);
    } catch (err) {
      console.error('[PDFViewer] 다운로드 오류:', err);
      setError('파일 다운로드 중 오류가 발생했습니다.');
    } finally {
      setDownloading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 파일 선택 안 됨
  if (!selectedFile) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-muted/30">
        <div className="text-center p-8">
          <FileQuestion className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">파일을 선택해주세요</h2>
          <p className="text-sm text-muted-foreground">
            좌측 패널에서 PDF 파일을 클릭하면
            <br />
            여기에 미리보기가 표시됩니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Chrome PDF 설정 안내 배너 - PDF 로드 실패시에만 표시 */}
      {showBanner && !pdfLoadSuccess && pdfUrl && !loading && (
        <div className="bg-red-50 dark:bg-red-950 border-b-2 border-red-300 dark:border-red-700 px-4 py-3">
          <div className="flex items-center justify-between gap-4 max-w-5xl mx-auto">
            <div className="flex items-center gap-3 min-w-0">
              <div className="text-red-600 dark:text-red-400 flex-shrink-0 text-lg">⚠️</div>
              <p className="text-sm text-red-900 dark:text-red-100">
                <span className="font-bold">PDF 미리보기가 안 보이나요?</span>
                <span className="hidden sm:inline"> Chrome 설정에서 &quot;<span className="font-semibold">Chrome에서 PDF 열기</span>&quot;를 켜주세요.</span>
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => {
                  navigator.clipboard.writeText('chrome://settings/content/pdfDocuments');
                  alert('Chrome 설정 주소가 복사되었습니다!\n\n새 탭을 열어 주소창에 붙여넣으세요:\nchrome://settings/content/pdfDocuments');
                }}
                className="text-xs sm:text-sm text-red-700 dark:text-red-300 hover:underline font-bold whitespace-nowrap"
              >
                설정 열기 →
              </button>
              <button
                onClick={() => setShowBanner(false)}
                className="ml-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 transition-colors"
                aria-label="배너 닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상단 툴바 - 간결한 한 줄 */}
      <div className="border-b px-4 py-2 flex items-center justify-between bg-background">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFile}
            className="flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
            <h3 className="font-semibold truncate">{selectedFile.name}</h3>
          </div>
        </div>

        <Button
          onClick={handleDownload}
          disabled={!pdfUrl || downloading}
          className="flex-shrink-0"
        >
          {downloading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          다운로드
        </Button>
      </div>

      {/* PDF 컨텐츠 영역 */}
      <div className="flex-1 relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">PDF 불러오는 중...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-lg font-semibold mb-2">{error}</p>
              <Button
                onClick={handleDownload}
                disabled={downloading}
                className="mt-4"
              >
                {downloading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    다운로드 중...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    다운로드
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {pdfUrl && !error && (
          <iframe
            src={pdfUrl}
            className="w-full h-full border-0"
            title={selectedFile.name}
            onLoad={() => {
              console.log('[PDFViewer] PDF 로드 완료');
              setPdfLoadSuccess(true);
            }}
            onError={() => {
              console.log('[PDFViewer] PDF 로드 실패 - iframe 에러');
              setError('PDF를 표시할 수 없습니다.');
              setPdfLoadSuccess(false);
            }}
          />
        )}
      </div>
    </div>
  );
}

