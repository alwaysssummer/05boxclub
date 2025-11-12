'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpDown, Search, BookOpen, Eye } from 'lucide-react';
import Link from 'next/link';

interface Textbook {
  id: string;
  name: string;
  description: string | null;
  total_clicks: number;
  is_active: boolean;
  file_count: number;
  created_at: string;
  updated_at: string;
}

export default function TextbooksPage() {
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'clicks' | 'name'>('clicks');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchTextbooks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        sort: sortBy,
        order: sortOrder,
        search,
      });

      const response = await fetch(`/api/admin/textbooks?${params}`);
      const data = await response.json();

      if (data.success) {
        setTextbooks(data.textbooks);
      }
    } catch (error) {
      console.error('Error fetching textbooks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTextbooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, sortOrder, search]);

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/textbooks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !currentStatus }),
      });

      const data = await response.json();

      if (data.success) {
        // 목록 새로고침
        fetchTextbooks();
      }
    } catch (error) {
      console.error('Error toggling textbook status:', error);
    }
  };

  const toggleSort = (field: 'clicks' | 'name') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">교재 관리</h1>
        <p className="text-muted-foreground">
          교재별 상세 통계 및 활성화 관리
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 교재</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{textbooks.length}</div>
            <p className="text-xs text-muted-foreground">
              활성: {textbooks.filter(t => t.is_active).length}개
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 클릭수</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {textbooks.reduce((sum, t) => sum + t.total_clicks, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              전체 교재 누적
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 파일</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {textbooks.reduce((sum, t) => sum + t.file_count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              PDF 파일
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 검색 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="교재명 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={fetchTextbooks} variant="outline">
          새로고침
        </Button>
      </div>

      {/* 교재 목록 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>교재 목록</CardTitle>
          <CardDescription>
            교재를 클릭하면 상세 통계를 확인할 수 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              로딩 중...
            </div>
          ) : textbooks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              교재가 없습니다
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => toggleSort('name')}
                      className="flex items-center gap-1"
                    >
                      교재명
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => toggleSort('clicks')}
                      className="flex items-center gap-1"
                    >
                      클릭수
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>파일 수</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>생성일</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {textbooks.map((textbook) => (
                  <TableRow key={textbook.id}>
                    <TableCell className="font-medium">
                      {textbook.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {textbook.total_clicks.toLocaleString()}
                      </Badge>
                    </TableCell>
                    <TableCell>{textbook.file_count}개</TableCell>
                    <TableCell>
                      <Badge variant={textbook.is_active ? 'default' : 'outline'}>
                        {textbook.is_active ? '활성' : '비활성'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(textbook.created_at)}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(textbook.id, textbook.is_active)}
                      >
                        {textbook.is_active ? '비활성화' : '활성화'}
                      </Button>
                      <Link href={`/admin/textbooks/${textbook.id}`}>
                        <Button variant="default" size="sm">
                          상세보기
                        </Button>
                      </Link>
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
