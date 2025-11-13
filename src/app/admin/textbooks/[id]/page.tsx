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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ArrowLeft, BookOpen, Eye, FileText, TrendingUp, FolderOpen } from 'lucide-react';
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
  totalFolders?: number;
}

interface FolderStats {
  folderName: string;
  folderPath: string;
  files: File[];
  totalClicks: number;
  fileCount: number;
  avgClicks: number;
}

export default function TextbookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [textbook, setTextbook] = useState<Textbook | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [folderStats, setFolderStats] = useState<FolderStats[]>([]);
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
        setFolderStats(data.folderStats || []);
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

      {/* 폴더별 통계 */}
      {folderStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              폴더별 통계
            </CardTitle>
            <CardDescription>
              단원(폴더)별 클릭 수 집계
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {folderStats.map((folder) => (
                <Card key={folder.folderName} className="border-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-blue-500" />
                      {folder.folderName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">파일 수</span>
                      <span className="font-medium">{folder.fileCount}개</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">총 클릭</span>
                      <span className="font-bold text-blue-600">
                        {folder.totalClicks.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">평균 클릭</span>
                      <span className="font-medium">{folder.avgClicks}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 폴더별 파일 목록 (아코디언) */}
      {folderStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>폴더별 파일 상세</CardTitle>
            <CardDescription>
              각 폴더의 파일 목록 및 클릭수
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {folderStats.map((folder) => (
                <AccordionItem key={folder.folderName} value={folder.folderName}>
                  <AccordionTrigger>
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">{folder.folderName}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <Badge variant="secondary">
                          {folder.fileCount}개 파일
                        </Badge>
                        <Badge variant="default">
                          {folder.totalClicks.toLocaleString()} 클릭
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">순위</TableHead>
                          <TableHead>파일명</TableHead>
                          <TableHead className="w-24 text-right">클릭수</TableHead>
                          <TableHead className="w-20">상태</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {folder.files
                          .sort((a, b) => (b.click_count || 0) - (a.click_count || 0))
                          .map((file, index) => (
                            <TableRow key={file.id}>
                              <TableCell>
                                {index < 3 ? (
                                  <Badge variant="outline" className="w-8 justify-center">
                                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-center block">
                                    {index + 1}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="font-medium">
                                {file.file_name || file.name}
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge variant="secondary">
                                  {(file.click_count || 0).toLocaleString()}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={file.is_active ? 'default' : 'outline'}
                                  className="text-xs"
                                >
                                  {file.is_active ? '활성' : '비활성'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* 전체 파일 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>전체 파일 목록</CardTitle>
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
