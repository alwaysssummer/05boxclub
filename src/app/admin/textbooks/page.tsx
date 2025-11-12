'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Book,
  ChevronRight,
  ChevronDown,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  GripVertical,
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon: string;
  display_order: number;
}

interface TextbookItem {
  id: string;
  name: string;
  dropbox_path: string;
  category: Category | null;
  totalClicks: number;
  fileCount: number;
  children: any;
}

// 드래그 가능한 교재 아이템
function SortableTextbook({ textbook }: { textbook: TextbookItem }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: textbook.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg hover:border-primary cursor-move"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      <Book className="w-4 h-4 text-indigo-600 flex-shrink-0" />
      <span className="flex-1 text-sm font-medium truncate">{textbook.name}</span>
      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
        {textbook.fileCount}개
      </Badge>
      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
        {textbook.totalClicks}
      </Badge>
    </div>
  );
}

// 드래그 가능한 카테고리 (순서 변경용)
function SortableCategory({
  category,
  textbooks,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onUpdate,
}: {
  category: Category;
  textbooks: TextbookItem[];
  isExpanded: boolean;
  onToggle: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onUpdate?: (id: string, name: string, icon: string) => void;
}) {
  const categoryId = category.id;
  const categoryName = category.name;
  const categoryIcon = category.icon;

  const [isEditing, setIsEditing] = React.useState(false);
  const [editName, setEditName] = React.useState(categoryName);
  const [editIcon, setEditIcon] = React.useState(categoryIcon);

  // 카테고리 드래그 앤 드롭 (순서 변경)
  const {
    attributes: sortableAttributes,
    listeners: sortableListeners,
    setNodeRef: setSortableNodeRef,
    transform: sortableTransform,
    transition: sortableTransition,
    isDragging,
  } = useSortable({ id: categoryId });

  // 교재 드롭 영역
  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({
    id: categoryId,
  });

  // 두 개의 ref를 병합
  const setNodeRef = (node: HTMLElement | null) => {
    setSortableNodeRef(node);
    setDroppableNodeRef(node);
  };

  const style = {
    transform: CSS.Transform.toString(sortableTransform),
    transition: sortableTransition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = () => {
    if (category && onUpdate && editName.trim()) {
      onUpdate(category.id, editName.trim(), editIcon);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditName(categoryName);
    setEditIcon(categoryIcon);
    setIsEditing(false);
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`mb-4 transition-colors ${isOver ? 'ring-2 ring-primary ring-offset-2' : ''}`}
    >
      {/* 카테고리 헤더 */}
      <div className="flex items-center gap-2 px-3 py-2 mb-2 bg-muted/50 rounded-lg border-b-2 border-primary/20">
        {isEditing ? (
          <>
            <Input
              value={editIcon}
              onChange={(e) => setEditIcon(e.target.value)}
              className="w-12 h-8 text-center"
              maxLength={2}
            />
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="flex-1 h-8"
              placeholder="카테고리 이름"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') handleCancel();
              }}
              autoFocus
            />
            <Button size="sm" onClick={handleSave} className="h-8 px-2">
              저장
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel} className="h-8 px-2">
              취소
            </Button>
          </>
        ) : (
          <>
            {/* 카테고리 드래그 핸들 */}
            <div 
              {...sortableAttributes} 
              {...sortableListeners}
              className="cursor-grab active:cursor-grabbing p-1 -ml-1 hover:bg-muted rounded"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>

            <button
              onClick={onToggle}
              className="flex items-center gap-2 flex-1 hover:bg-muted/70 rounded px-1"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-primary" />
              ) : (
                <ChevronRight className="w-4 h-4 text-primary" />
              )}
              <span className="text-base">{categoryIcon}</span>
              <span 
                className="font-semibold text-sm text-primary cursor-pointer hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
              >
                {categoryName}
              </span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-auto">
                {textbooks.length}
              </Badge>
            </button>

            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
                className="h-6 w-6 p-0"
              >
                <Edit className="w-3 h-3" />
              </Button>
              {onDelete && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onDelete}
                  className="h-6 w-6 p-0 text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          </>
        )}
      </div>

      {/* 교재 목록 */}
      {isExpanded && (
        <div className="space-y-2 px-2">
          {textbooks.length === 0 ? (
            <div className="text-center py-4 text-sm text-muted-foreground">
              교재가 없습니다. 다른 카테고리에서 드래그하여 이동하세요.
            </div>
          ) : (
            <SortableContext
              items={textbooks.map(t => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {textbooks.map(textbook => (
                <SortableTextbook key={textbook.id} textbook={textbook} />
              ))}
            </SortableContext>
          )}
        </div>
      )}
    </div>
  );
}

// 미분류 카테고리 (드래그 불가)
function DroppableUncategorized({
  textbooks,
  isExpanded,
  onToggle,
}: {
  textbooks: TextbookItem[];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'uncategorized',
  });

  return (
    <div 
      ref={setNodeRef}
      className={`mb-4 transition-colors ${isOver ? 'ring-2 ring-primary ring-offset-2' : ''}`}
    >
      {/* 카테고리 헤더 */}
      <div className="flex items-center gap-2 px-3 py-2 mb-2 bg-muted/50 rounded-lg border-b-2 border-primary/20">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 flex-1 hover:bg-muted/70 rounded px-1"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-primary" />
          ) : (
            <ChevronRight className="w-4 h-4 text-primary" />
          )}
          <span className="text-base">📚</span>
          <span className="font-semibold text-sm text-primary">
            미분류
          </span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-auto">
            {textbooks.length}
          </Badge>
        </button>
      </div>

      {/* 교재 목록 */}
      {isExpanded && (
        <div className="space-y-2 px-2">
          {textbooks.length === 0 ? (
            <div className="text-center py-4 text-sm text-muted-foreground">
              미분류 교재가 없습니다
            </div>
          ) : (
            <SortableContext items={textbooks.map(t => t.id)} strategy={verticalListSortingStrategy}>
              {textbooks.map(textbook => (
                <SortableTextbook key={textbook.id} textbook={textbook} />
              ))}
            </SortableContext>
          )}
        </div>
      )}
    </div>
  );
}

export default function TextbooksManagementPage() {
  const [textbooks, setTextbooks] = useState<TextbookItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['all']));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('📚');
  const [showAddCategory, setShowAddCategory] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 데이터 로드
  const loadData = async () => {
    try {
      setLoading(true);
      
      // 카테고리 로드
      const catRes = await fetch('/api/admin/categories');
      const catData = await catRes.json();
      if (catData.success) {
        setCategories(catData.categories || []);
      }

      // 교재 로드 (파일 트리 API 사용)
      const tbRes = await fetch('/api/files/tree');
      const tbData = await tbRes.json();
      if (tbData.success) {
        setTextbooks(tbData.data || []);
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 카테고리별로 교재 그룹화
  const groupedTextbooks = textbooks.reduce((acc, textbook) => {
    const categoryId = textbook.category?.id || 'uncategorized';
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(textbook);
    return acc;
  }, {} as Record<string, TextbookItem[]>);

  // 카테고리 토글
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // 카테고리 추가
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName,
          icon: newCategoryIcon,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNewCategoryName('');
        setNewCategoryIcon('📚');
        setShowAddCategory(false);
        loadData();
      }
    } catch (error) {
      console.error('카테고리 추가 실패:', error);
    }
  };

  // 카테고리 수정
  const handleUpdateCategory = async (categoryId: string, name: string, icon: string) => {
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: categoryId,
          name,
          icon,
        }),
      });

      const data = await res.json();
      if (data.success) {
        loadData();
      } else {
        alert('카테고리 수정 실패: ' + (data.error || '알 수 없는 오류'));
      }
    } catch (error) {
      console.error('카테고리 수정 실패:', error);
      alert('카테고리 수정 실패');
    }
  };

  // 카테고리 삭제
  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('이 카테고리를 삭제하시겠습니까?\n교재는 &quot;미분류&quot;로 이동됩니다.')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/categories?id=${categoryId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        loadData();
      }
    } catch (error) {
      console.error('카테고리 삭제 실패:', error);
    }
  };

  // 드래그 시작
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // 드래그 종료
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);

    if (!over || active.id === over.id) return;

    // 1. 카테고리 순서 변경인지 확인
    const draggedCategory = categories.find(c => c.id === active.id);
    const overCategory = categories.find(c => c.id === over.id);

    if (draggedCategory && overCategory) {
      // 카테고리 순서 변경
      console.log(`카테고리 순서 변경: ${draggedCategory.name} → ${overCategory.name} 앞으로`);
      
      const oldIndex = categories.findIndex(c => c.id === active.id);
      const newIndex = categories.findIndex(c => c.id === over.id);

      // 낙관적 UI 업데이트
      const newCategories = [...categories];
      const [movedCategory] = newCategories.splice(oldIndex, 1);
      newCategories.splice(newIndex, 0, movedCategory);
      
      // display_order 재정렬
      const updatedCategories = newCategories.map((cat, index) => ({
        ...cat,
        display_order: index + 1,
      }));
      
      setCategories(updatedCategories);

      // API 호출 (백그라운드)
      try {
        await fetch('/api/admin/categories/reorder', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            categories: updatedCategories.map(c => ({ id: c.id, display_order: c.display_order })),
          }),
        });
      } catch (error) {
        console.error('카테고리 순서 변경 실패:', error);
        // 실패 시 데이터 다시 로드
        loadData();
      }
      return;
    }

    // 2. 교재 이동인지 확인
    const draggedTextbook = textbooks.find(t => t.id === active.id);
    if (!draggedTextbook) return;

    // 드롭한 위치의 카테고리 찾기
    let targetCategoryId: string | null = null;
    
    // over.id가 교재 ID인 경우, 해당 교재의 카테고리를 찾음
    const targetTextbook = textbooks.find(t => t.id === over.id);
    if (targetTextbook) {
      targetCategoryId = targetTextbook.category?.id || null;
    } else {
      // over.id가 카테고리 ID인 경우
      targetCategoryId = over.id === 'uncategorized' ? null : (over.id as string);
    }

    // 같은 카테고리면 무시
    const currentCategoryId = draggedTextbook.category?.id || null;
    if (currentCategoryId === targetCategoryId) return;

    console.log(`교재 이동: ${draggedTextbook.name} → 카테고리 ID: ${targetCategoryId || 'null'}`);

    // API 호출
    try {
      const res = await fetch('/api/admin/textbooks/move', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textbook_id: draggedTextbook.id,
          category_id: targetCategoryId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // 데이터 새로고침
        loadData();
      } else {
        alert('교재 이동 실패: ' + (data.error || '알 수 없는 오류'));
      }
    } catch (error) {
      console.error('교재 이동 실패:', error);
      alert('교재 이동 실패');
    }
  };

  const activeTextbook = textbooks.find(t => t.id === activeId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
      <div>
          <h1 className="text-3xl font-bold">교재 관리</h1>
          <p className="text-muted-foreground mt-1">
            교재를 드래그하여 카테고리 간 이동할 수 있습니다
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            새로고침
          </Button>
          <Button onClick={() => setShowAddCategory(!showAddCategory)}>
            <Plus className="w-4 h-4 mr-2" />
            카테고리 추가
          </Button>
        </div>
      </div>

      {/* 카테고리 추가 폼 */}
      {showAddCategory && (
        <div className="mb-6 p-4 border rounded-lg bg-muted/30">
          <h3 className="font-semibold mb-3">새 카테고리 추가</h3>
          <div className="flex gap-2">
            <Input
              placeholder="이모지 (예: 📚)"
              value={newCategoryIcon}
              onChange={(e) => setNewCategoryIcon(e.target.value)}
              className="w-20"
              maxLength={2}
            />
            <Input
              placeholder="카테고리 이름"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleAddCategory}>추가</Button>
            <Button variant="outline" onClick={() => setShowAddCategory(false)}>
              취소
            </Button>
            </div>
          </div>
      )}

      {/* 드래그 앤 드롭 컨텍스트 */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-4">
          {/* 카테고리별 교재 목록 (순서 변경 가능) */}
          <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
            {categories.map(category => (
              <SortableCategory
                key={category.id}
                category={category}
                textbooks={groupedTextbooks[category.id] || []}
                isExpanded={expandedCategories.has(category.id)}
                onToggle={() => toggleCategory(category.id)}
                onUpdate={handleUpdateCategory}
                onDelete={() => handleDeleteCategory(category.id)}
              />
            ))}
          </SortableContext>

          {/* 미분류 카테고리 (순서 변경 불가) */}
          <DroppableUncategorized
            textbooks={groupedTextbooks['uncategorized'] || []}
            isExpanded={expandedCategories.has('uncategorized')}
            onToggle={() => toggleCategory('uncategorized')}
          />
        </div>

        {/* 드래그 오버레이 */}
        <DragOverlay>
          {activeTextbook && (
            <div className="flex items-center gap-2 px-3 py-2 bg-white border-2 border-primary rounded-lg shadow-lg">
              <Book className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-medium">{activeTextbook.name}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* 안내 메시지 */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">💡 사용 방법</h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• <strong>카테고리 순서 변경:</strong> 카테고리 왼쪽의 ⣿ 핸들을 드래그하여 순서를 변경할 수 있습니다</li>
          <li>• <strong>교재 이동:</strong> 교재의 ⣿ 핸들을 드래그하여 다른 카테고리로 이동할 수 있습니다</li>
          <li>• <strong>카테고리 편집:</strong> 카테고리 이름을 클릭하거나 편집 버튼을 눌러 수정할 수 있습니다</li>
          <li>• <strong>실시간 반영:</strong> 변경사항은 즉시 사용자 페이지에 반영됩니다</li>
          <li>• <strong>카테고리 삭제:</strong> 카테고리를 삭제하면 해당 교재는 &quot;미분류&quot;로 이동됩니다</li>
        </ul>
      </div>
    </div>
  );
}
