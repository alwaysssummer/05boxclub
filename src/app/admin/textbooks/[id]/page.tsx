'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BookOpen, Eye, FileText, TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface Textbook {
  id: string;
  name: string;
  description: string | null;
  total_clicks: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface File {
  id: string;
  file_name: string;
  file_path: string;
  click_count: number;
  is_active: boolean;
  last_modified: string;
}

interface DailyClick {
  date: string;
  clicks: number;
}

interface Statistics {
  totalFiles: number;
  totalClicks: number;
  activeFiles: number;
}

export default function TextbookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [textbook, setTextbook] = useState<Textbook | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dailyClicks, setDailyClicks] = useState<DailyClick[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTextbookDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchTextbookDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/textbooks/${id}`);
      const data = await response.json();

      if (data.success) {
        setTextbook(data.textbook);
        setFiles(data.files);
        setDailyClicks(data.dailyClicks);
        setStatistics(data.statistics);
      }
    } catch (error) {
      console.error('Error fetching textbook details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (!textbook) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg mb-4">교재를 찾을 수 없습니다</div>
          <Button onClick={() => router.push('/admin/textbooks')}>
            목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/admin/textbooks')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{textbook.name}</h1>
            <Badge variant={textbook.is_active ? 'default' : 'outline'}>
              {textbook.is_active ? '활성' : '비활성'}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {textbook.description || '교재 상세 정보'}
          </p>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 클릭수</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.totalClicks.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              전체 누적 조회수
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 파일</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.totalFiles}</div>
            <p className="text-xs text-muted-foreground">
              활성: {statistics?.activeFiles}개
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 클릭수</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.totalFiles
                ? Math.round(statistics.totalClicks / statistics.totalFiles)
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              파일당 평균
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 일별 클릭 추이 그래프 */}
      {dailyClicks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>최근 30일 클릭 추이</CardTitle>
            <CardDescription>일별 클릭수 변화</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyClicks}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => formatDate(value as string)}
                  formatter={(value: number) => [`${value}회`, '클릭수']}
                />
                <Legend />
                <Bar dataKey="clicks" fill="#3b82f6" name="클릭수" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* 파일 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>파일 목록</CardTitle>
          <CardDescription>
            파일별 클릭수 (클릭수 많은 순)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              파일이 없습니다
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>순위</TableHead>
                  <TableHead>파일명</TableHead>
                  <TableHead>경로</TableHead>
                  <TableHead>클릭수</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>최종 수정일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file, index) => (
                  <TableRow key={file.id}>
                    <TableCell>
                      {index < 3 ? (
                        <Badge
                          variant={
                            index === 0
                              ? 'default'
                              : index === 1
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">{index + 1}</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{file.file_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {file.file_path}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {file.click_count.toLocaleString()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={file.is_active ? 'default' : 'outline'}>
                        {file.is_active ? '활성' : '비활성'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(file.last_modified)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
