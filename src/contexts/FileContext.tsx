'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface FileInfo {
  id: string;
  name: string;
  dropbox_path: string;
  file_size: number;
  last_modified: string;
  textbook_name?: string;
}

interface FileContextType {
  selectedFile: FileInfo | null;
  selectFile: (file: FileInfo) => void;
  clearFile: () => void;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

export function FileProvider({ children }: { children: ReactNode }) {
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);

  const selectFile = (file: FileInfo) => {
    console.log('[FileContext] 파일 선택:', file.name);
    setSelectedFile(file);
  };

  const clearFile = () => {
    setSelectedFile(null);
  };

  return (
    <FileContext.Provider value={{ selectedFile, selectFile, clearFile }}>
      {children}
    </FileContext.Provider>
  );
}

export function useFile() {
  const context = useContext(FileContext);
  if (context === undefined) {
    throw new Error('useFile must be used within a FileProvider');
  }
  return context;
}


