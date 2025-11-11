import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

export default function AdminTextbooksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">교재 관리</h1>
        <p className="text-muted-foreground">
          교재 통계 및 관리 기능
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>교재 관리 기능 (준비 중)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-semibold mb-2">교재 관리 페이지</h3>
              <p>교재별 통계, 파일 관리, 클릭수 분석 기능이 추가될 예정입니다</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


