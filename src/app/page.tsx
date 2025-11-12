'use client';

import { useState } from 'react';
import { FileProvider } from '@/contexts/FileContext';
import LeftSidebar from '@/components/LeftSidebar';
import PDFViewer from '@/components/PDFViewer';
import RightSidebar from '@/components/RightSidebar';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Home() {
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);

  return (
    <FileProvider>
      <div className="flex h-screen overflow-hidden">
        {/* 좌측 패널: 닫히면 완전히 사라짐 (공간 차지 안 함) */}
        {isLeftSidebarOpen && (
          <aside className="relative min-w-[240px] w-[20%] max-w-[320px] flex-shrink-0 border-r border-border bg-background">
            {/* 토글 버튼 (좌측 패널 내부 오른쪽에 고정) */}
            <button
              onClick={() => setIsLeftSidebarOpen(false)}
              className="
                absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2
                z-50
                bg-gray-700 hover:bg-gray-600 text-white
                w-5 h-10 rounded-r-md shadow-lg
                hover:shadow-xl
                flex items-center justify-center
                transition-all duration-300
              "
              title="좌측 패널 닫기"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>

            <LeftSidebar />
          </aside>
        )}

        {/* 좌측 패널이 닫혔을 때 표시되는 열기 버튼 */}
        {!isLeftSidebarOpen && (
          <button
            onClick={() => setIsLeftSidebarOpen(true)}
            className="
              fixed left-0 top-1/2 -translate-y-1/2
              z-50
              bg-gray-700 hover:bg-gray-600 text-white
              w-5 h-10 rounded-r-md shadow-lg
              hover:shadow-xl
              flex items-center justify-center
              transition-all duration-300
            "
            title="좌측 패널 열기"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        )}

        {/* 중앙 패널: flex-1로 남은 공간 모두 사용 */}
        <main className="flex-1 min-w-[600px] overflow-auto">
          <PDFViewer />
        </main>

        {/* 우측 패널: 닫히면 완전히 사라짐 (공간 차지 안 함) */}
        {isRightSidebarOpen && (
          <aside className="relative min-w-[240px] w-[20%] max-w-[320px] flex-shrink-0 border-l border-border bg-background">
            {/* 토글 버튼 (우측 패널 내부 왼쪽에 고정) */}
            <button
              onClick={() => setIsRightSidebarOpen(false)}
              className="
                absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2
                z-50
                bg-gray-700 hover:bg-gray-600 text-white
                w-5 h-10 rounded-l-md shadow-lg
                hover:shadow-xl
                flex items-center justify-center
                transition-all duration-300
              "
              title="우측 패널 닫기"
            >
              <ChevronRight className="w-3 h-3" />
            </button>

            <RightSidebar />
          </aside>
        )}

        {/* 우측 패널이 닫혔을 때 표시되는 열기 버튼 */}
        {!isRightSidebarOpen && (
          <button
            onClick={() => setIsRightSidebarOpen(true)}
            className="
              fixed right-0 top-1/2 -translate-y-1/2
              z-50
              bg-gray-700 hover:bg-gray-600 text-white
              w-5 h-10 rounded-l-md shadow-lg
              hover:shadow-xl
              flex items-center justify-center
              transition-all duration-300
            "
            title="우측 패널 열기"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
        )}
      </div>
    </FileProvider>
  );
}
