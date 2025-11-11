'use client';

import { Clock, TrendingUp, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function RightSidebar() {
  return (
    <div className="h-full overflow-y-auto p-3 space-y-4">
      {/* 공지사항 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bell className="w-4 h-4" />
            공지사항
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-xs">
            <p className="font-medium mb-1">🎉 영어 자료실 오픈!</p>
            <p className="text-muted-foreground">
              무료로 다양한 영어 학습 자료를 이용하실 수 있습니다.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 교재 요청 순위 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            교재 요청 순위
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-xs text-muted-foreground">
            요청된 교재가 없습니다.
          </div>
        </CardContent>
      </Card>

      {/* 최근 조회 자료 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="w-4 h-4" />
            최근 조회 자료
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-xs text-muted-foreground">
            아직 조회한 자료가 없습니다.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


