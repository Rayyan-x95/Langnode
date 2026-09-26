import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import {
  DocumentService,
  DocumentInfo,
  RAGQueryResponse,
  SummarizeResponse,
  SavedNoteInfo,
} from '@/services/documents';
import { useAuth } from './AuthContext';

interface DocumentContextType {
  documents: DocumentInfo[];
  activeDocument: DocumentInfo | null;
  isUploading: boolean;
  uploadProgress: number;
  isProcessing: boolean;
  savedNotes: SavedNoteInfo[];
  loadDocuments: () => Promise<void>;
  loadSavedNotes: () => Promise<void>;
  pickAndUploadDocument: () => Promise<DocumentInfo | null>;
  selectDocument: (doc: DocumentInfo | null) => void;
  deleteDocument: (docId: string) => Promise<void>;
  queryActiveDocument: (
    query: string,
    language?: string,
    level?: string
  ) => Promise<RAGQueryResponse>;
  summarizeActiveDocument: (
    mode: 'quick' | 'detailed' | 'exam_notes' | 'key_points' | 'flashcards' | 'qa',
    language?: string
  ) => Promise<SummarizeResponse>;
  saveNote: (
    title: string,
    content: string,
    docId?: string,
    docName?: string,
    tags?: string[]
  ) => Promise<SavedNoteInfo>;
  deleteNote: (noteId: string) => Promise<void>;
  shareContent: (title: string, content: string) => Promise<void>;
}

const DocumentContext = createContext<DocumentContextType>({
  documents: [],
  activeDocument: null,
  isUploading: false,
  uploadProgress: 0,
  isProcessing: false,
  savedNotes: [],
  loadDocuments: async () => {},
  loadSavedNotes: async () => {},
  pickAndUploadDocument: async () => null,
  selectDocument: () => {},
  deleteDocument: async () => {},
  queryActiveDocument: async () => ({
    answer: '',
    language: 'en',
    sources: [],
    key_concepts: [],
    preserved_terms: [],
  }),
  summarizeActiveDocument: async () => ({
    document_id: '',
    document_name: '',
    mode: 'quick',
    language: 'en',
    content: '',
    sources: [],
  }),
  saveNote: async () => ({
    id: '',
    user_id: '',
    title: '',
    content: '',
    tags: [],
    created_at: '',
  }),
  deleteNote: async () => {},
  shareContent: async () => {},
});

export const DocumentProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const userId = user?.id || 'student_default';

  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [activeDocument, setActiveDocument] = useState<DocumentInfo | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [savedNotes, setSavedNotes] = useState<SavedNoteInfo[]>([]);

  useEffect(() => {
    loadDocuments();
    loadSavedNotes();
  }, [userId]);

  const loadDocuments = async () => {
    const list = await DocumentService.listDocuments(userId);
    setDocuments(list);
    if (!activeDocument && list.length > 0) {
      setActiveDocument(list[0]);
    }
  };

  const loadSavedNotes = async () => {
    const notes = await DocumentService.listNotes(userId);
    setSavedNotes(notes);
  };

  const pickAndUploadDocument = async (): Promise<DocumentInfo | null> => {
    try {
      const file = await DocumentService.pickDocument();
      if (!file) return null;

      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}

      setIsUploading(true);
      setUploadProgress(10);
      setIsProcessing(true);

      const doc = await DocumentService.uploadDocument(
        file.uri,
        file.name,
        userId,
        (progress) => setUploadProgress(progress)
      );

      setDocuments((prev) => [doc, ...prev.filter((d) => d.id !== doc.id)]);
      setActiveDocument(doc);
      setIsUploading(false);
      setIsProcessing(false);
      setUploadProgress(0);

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      return doc;
    } catch (err) {
      setIsUploading(false);
      setIsProcessing(false);
      setUploadProgress(0);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
      throw err;
    }
  };

  const selectDocument = (doc: DocumentInfo | null) => {
    setActiveDocument(doc);
  };

  const deleteDocument = async (docId: string) => {
    await DocumentService.deleteDocument(docId, userId);
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    if (activeDocument?.id === docId) {
      const remaining = documents.filter((d) => d.id !== docId);
      setActiveDocument(remaining.length > 0 ? remaining[0] : null);
    }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  };

  const queryActiveDocument = async (
    query: string,
    language = 'auto',
    level = 'Beginner'
  ): Promise<RAGQueryResponse> => {
    if (!activeDocument) {
      throw new Error('No active document selected.');
    }
    return DocumentService.queryDocument(activeDocument.id, query, language, level, userId);
  };

  const summarizeActiveDocument = async (
    mode: 'quick' | 'detailed' | 'exam_notes' | 'key_points' | 'flashcards' | 'qa',
    language = 'en'
  ): Promise<SummarizeResponse> => {
    if (!activeDocument) {
      throw new Error('No active document selected.');
    }
    return DocumentService.summarizeDocument(activeDocument.id, mode, language, userId);
  };

  const saveNote = async (
    title: string,
    content: string,
    docId?: string,
    docName?: string,
    tags?: string[]
  ): Promise<SavedNoteInfo> => {
    const effectiveDocId = docId || activeDocument?.id;
    const effectiveDocName = docName || activeDocument?.filename;

    const note = await DocumentService.saveNote(
      title,
      content,
      effectiveDocId,
      effectiveDocName,
      tags,
      userId
    );
    setSavedNotes((prev) => [note, ...prev.filter((n) => n.id !== note.id)]);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    return note;
  };

  const deleteNote = async (noteId: string) => {
    await DocumentService.deleteNote(noteId, userId);
    setSavedNotes((prev) => prev.filter((n) => n.id !== noteId));
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  };

  const shareContent = async (title: string, content: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    await DocumentService.shareContent(title, content);
  };

  return (
    <DocumentContext.Provider
      value={{
        documents,
        activeDocument,
        isUploading,
        uploadProgress,
        isProcessing,
        savedNotes,
        loadDocuments,
        loadSavedNotes,
        pickAndUploadDocument,
        selectDocument,
        deleteDocument,
        queryActiveDocument,
        summarizeActiveDocument,
        saveNote,
        deleteNote,
        shareContent,
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocuments = () => useContext(DocumentContext);
