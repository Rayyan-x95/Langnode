import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { useDocuments } from '@/context/DocumentContext';
import { AppHeader, HeaderButton } from '@/components/AppHeader';
import {
  DocumentInfo,
  RAGQueryResponse,
  SummarizeResponse,
} from '@/services/documents';

export default function DocumentsScreen() {
  const { colors } = useTheme();
  const {
    documents,
    activeDocument,
    isUploading,
    uploadProgress,
    isProcessing,
    savedNotes,
    pickAndUploadDocument,
    selectDocument,
    deleteDocument,
    queryActiveDocument,
    summarizeActiveDocument,
    saveNote,
    deleteNote,
    shareContent,
  } = useDocuments();

  // Active UI View: 'library' | 'study' | 'notes'
  const [activeTab, setActiveTab] = useState<'library' | 'study' | 'notes'>('library');

  // Study / RAG State
  const [questionText, setQuestionText] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [ragResult, setRagResult] = useState<RAGQueryResponse | null>(null);

  // Summarize Modal / View State
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryMode, setSummaryMode] = useState<
    'quick' | 'detailed' | 'exam_notes' | 'key_points' | 'flashcards' | 'qa'
  >('quick');
  const [summaryLang, setSummaryLang] = useState<'en' | 'ta' | 'hi'>('en');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryResult, setSummaryResult] = useState<SummarizeResponse | null>(null);

  // Interactive Flashcard index
  const [activeFlashcardIndex, setActiveFlashcardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Note save feedback banner
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);

  const handleUpload = async () => {
    try {
      const doc = await pickAndUploadDocument();
      if (doc) {
        setActiveTab('study');
      }
    } catch {
      Alert.alert('Upload Error', 'Could not parse the selected document. Please check the file format.');
    }
  };

  const handleSelectDoc = (doc: DocumentInfo) => {
    selectDocument(doc);
    setRagResult(null);
    setSummaryResult(null);
    setActiveTab('study');
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  };

  const handleDeleteDoc = (doc: DocumentInfo) => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to remove "${doc.filename}" from your study materials?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteDocument(doc.id),
        },
      ]
    );
  };

  const handleAskQuestion = async (queryToAsk?: string) => {
    const q = (queryToAsk || questionText).trim();
    if (!q || !activeDocument || isQuerying) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    setIsQuerying(true);
    setQuestionText(q);

    try {
      const res = await queryActiveDocument(q);
      setRagResult(res);
    } catch (err: any) {
      Alert.alert('Study Assistant Error', err?.message || 'Failed to query document.');
    } finally {
      setIsQuerying(false);
    }
  };

  const handleRunSummary = async (
    mode: 'quick' | 'detailed' | 'exam_notes' | 'key_points' | 'flashcards' | 'qa',
    lang = summaryLang
  ) => {
    if (!activeDocument) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    setSummaryMode(mode);
    setSummaryLang(lang);
    setIsSummarizing(true);
    setShowSummaryModal(true);
    setIsCardFlipped(false);
    setActiveFlashcardIndex(0);

    try {
      const res = await summarizeActiveDocument(mode, lang);
      setSummaryResult(res);
    } catch (err: any) {
      Alert.alert('Summary Error', err?.message || 'Failed to generate study summary.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSaveToNotes = async (title: string, content: string) => {
    try {
      await saveNote(title, content);
      setSavedSuccessMsg('Saved to your Study Notes!');
      setTimeout(() => setSavedSuccessMsg(null), 3000);
    } catch {
      Alert.alert('Note Error', 'Could not save note.');
    }
  };

  const handleShare = async (title: string, content: string) => {
    await shareContent(title, content);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top Header */}
      <AppHeader
        title="Study Materials"
        subtitle="Document RAG & Multilingual Explanations"
        icon="book"
        badge={
          documents.length > 0
            ? {
                text: `${documents.length} Docs`,
                color: colors.primary,
                bgColor: colors.primaryLight,
              }
            : undefined
        }
        actions={
          <HeaderButton
            icon="cloud-upload"
            label="Upload"
            variant="primary"
            onPress={handleUpload}
          />
        }
      />

      {/* Tab Switcher: Library | Study & Ask | Saved Notes */}
      <View style={[styles.tabsWrapper, { borderBottomColor: colors.borderSubtle, backgroundColor: colors.surface }]}>
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === 'library' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
            onPress={() => setActiveTab('library')}
          >
            <Ionicons
              name="folder-open-outline"
              size={16}
              color={activeTab === 'library' ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.tabItemText,
                { color: activeTab === 'library' ? colors.primary : colors.textMuted },
              ]}
            >
              Documents ({documents.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === 'study' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
            onPress={() => setActiveTab('study')}
          >
            <Ionicons
              name="sparkles-outline"
              size={16}
              color={activeTab === 'study' ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.tabItemText,
                { color: activeTab === 'study' ? colors.primary : colors.textMuted },
              ]}
            >
              Study & Ask
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === 'notes' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
            onPress={() => setActiveTab('notes')}
          >
            <Ionicons
              name="bookmark-outline"
              size={16}
              color={activeTab === 'notes' ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.tabItemText,
                { color: activeTab === 'notes' ? colors.primary : colors.textMuted },
              ]}
            >
              Saved Notes ({savedNotes.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Live Upload Progress & Processing Banner */}
      {(isUploading || isProcessing) && (
        <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
          <View style={styles.progressRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.progressTitle, { color: colors.text }]}>
              {uploadProgress < 100
                ? `Uploading Document (${uploadProgress}%)...`
                : 'Extracting text & generating vector embeddings...'}
            </Text>
          </View>
          <View style={[styles.progressBarTrack, { backgroundColor: colors.borderSubtle }]}>
            <View style={[styles.progressBarFill, { width: `${uploadProgress}%`, backgroundColor: colors.primary }]} />
          </View>
        </View>
      )}

      {/* Success alert message */}
      {savedSuccessMsg && (
        <View style={[styles.toastSuccess, { backgroundColor: colors.success + '20', borderColor: colors.success }]}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Text style={[styles.toastSuccessText, { color: colors.success }]}>{savedSuccessMsg}</Text>
        </View>
      )}

      {/* TAB 1: DOCUMENT LIBRARY */}
      {activeTab === 'library' && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Upload Drop Zone Card */}
          <TouchableOpacity
            style={[
              styles.uploadDropZone,
              {
                backgroundColor: colors.primaryLight,
                borderColor: colors.primary,
              },
            ]}
            onPress={handleUpload}
            activeOpacity={0.8}
          >
            <View style={[styles.uploadCircle, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="document-text" size={28} color={colors.primary} />
            </View>
            <Text style={[styles.uploadDropTitle, { color: colors.text }]}>Select Study Material</Text>
            <Text style={[styles.uploadDropSubtitle, { color: colors.textSecondary }]}>
              Supports PDF, DOCX, TXT, and Markdown files
            </Text>
            <View style={styles.supportedPillRow}>
              {['PDF', 'DOCX', 'TXT', 'MD'].map((ext) => (
                <View key={ext} style={[styles.supportedPill, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.supportedPillText, { color: colors.primary }]}>{ext}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>

          {/* Section: Uploaded Materials */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Uploaded Documents</Text>
            <Text style={[styles.sectionCount, { color: colors.textMuted }]}>{documents.length} files</Text>
          </View>

          {documents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="documents-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No documents uploaded yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Upload your lecture notes, textbook chapters, or problem sheets to ask questions and generate notes.
              </Text>
            </View>
          ) : (
            documents.map((doc) => {
              const isSelected = activeDocument?.id === doc.id;
              return (
                <View
                  key={doc.id}
                  style={[
                    styles.docCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                      borderWidth: isSelected ? 1.5 : 1,
                    },
                  ]}
                >
                  <View style={styles.docCardTop}>
                    <View style={styles.docIconAndMeta}>
                      <View
                        style={[
                          styles.docTypeBadge,
                          {
                            backgroundColor:
                              doc.file_type === 'pdf'
                                ? '#EF444420'
                                : doc.file_type === 'docx'
                                ? '#2563EB20'
                                : '#10B98120',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.docTypeBadgeText,
                            {
                              color:
                                doc.file_type === 'pdf'
                                  ? '#EF4444'
                                  : doc.file_type === 'docx'
                                  ? '#2563EB'
                                  : '#10B981',
                            },
                          ]}
                        >
                          {doc.file_type.toUpperCase()}
                        </Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={[styles.docFilename, { color: colors.text }]} numberOfLines={1}>
                          {doc.filename}
                        </Text>
                        <View style={styles.docStatsRow}>
                          <Text style={[styles.docStatText, { color: colors.textSecondary }]}>
                            {doc.total_pages} {doc.total_pages === 1 ? 'page' : 'pages'} • {doc.total_chunks} chunks
                          </Text>
                          <View
                            style={[
                              styles.statusDotBadge,
                              { backgroundColor: doc.status === 'ready' ? colors.success + '20' : colors.warning + '20' },
                            ]}
                          >
                            <View
                              style={[
                                styles.statusDot,
                                { backgroundColor: doc.status === 'ready' ? colors.success : colors.warning },
                              ]}
                            />
                            <Text
                              style={[
                                styles.statusDotText,
                                { color: doc.status === 'ready' ? colors.success : colors.warning },
                              ]}
                            >
                              {doc.status.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleDeleteDoc(doc)}
                      style={styles.trashBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>

                  {/* Document Card Action Buttons */}
                  <View style={[styles.docActionsBar, { borderTopColor: colors.border }]}>
                    <TouchableOpacity
                      style={[styles.docActionBtn, { backgroundColor: colors.primary }]}
                      onPress={() => handleSelectDoc(doc)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="chatbubbles" size={14} color="#FFFFFF" />
                      <Text style={styles.docActionBtnText}>Ask Questions</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.docActionBtnSecondary, { borderColor: colors.border }]}
                      onPress={() => {
                        selectDocument(doc);
                        handleRunSummary('quick');
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="newspaper-outline" size={14} color={colors.text} />
                      <Text style={[styles.docActionBtnSecondaryText, { color: colors.text }]}>Summarize</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* TAB 2: STUDY & ASK RAG */}
      {activeTab === 'study' && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {activeDocument ? (
            <>
              {/* Active Document Header Card */}
              <View style={[styles.activeDocBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.activeDocLeft}>
                  <Ionicons name="document-attach" size={20} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.activeDocTitle, { color: colors.text }]} numberOfLines={1}>
                      {activeDocument.filename}
                    </Text>
                    <Text style={[styles.activeDocSubtitle, { color: colors.textSecondary }]}>
                      {activeDocument.total_pages} page(s) • Ready for semantic Q&A
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => handleRunSummary('quick')}
                  style={[styles.quickSummaryChip, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
                >
                  <Ionicons name="bulb-outline" size={12} color={colors.primary} />
                  <Text style={[styles.quickSummaryChipText, { color: colors.primary }]}>Study Notes</Text>
                </TouchableOpacity>
              </View>

              {/* Preset Suggested Questions (including Tamil) */}
              <Text style={[styles.presetHeader, { color: colors.textSecondary }]}>Quick Queries & Vernacular Prompts:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsScroll}>
                <TouchableOpacity
                  style={[styles.presetChip, { backgroundColor: colors.surface, borderColor: colors.primary }]}
                  onPress={() => handleAskQuestion('Explain this chapter in Tamil.')}
                >
                  <Text style={styles.presetEmoji}>🗣️</Text>
                  <Text style={[styles.presetText, { color: colors.primary, fontWeight: '700' }]}>
                    Explain this chapter in Tamil
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.presetChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => handleAskQuestion('What are the key mechanisms and core formulas in this text?')}
                >
                  <Text style={styles.presetEmoji}>🔬</Text>
                  <Text style={[styles.presetText, { color: colors.text }]}>Key Mechanisms & Formulas</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.presetChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => handleAskQuestion('What are common exam questions from this document?')}
                >
                  <Text style={styles.presetEmoji}>🎯</Text>
                  <Text style={[styles.presetText, { color: colors.text }]}>Exam Questions</Text>
                </TouchableOpacity>
              </ScrollView>

              {/* Question Input Box */}
              <View style={[styles.queryInputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.queryInput, { color: colors.text }]}
                  placeholder="Ask any question from this material (e.g., 'Explain in Tamil')..."
                  placeholderTextColor={colors.textMuted}
                  value={questionText}
                  onChangeText={setQuestionText}
                  multiline
                />
                <TouchableOpacity
                  style={[
                    styles.sendQueryBtn,
                    { backgroundColor: questionText.trim() && !isQuerying ? colors.primary : colors.border },
                  ]}
                  onPress={() => handleAskQuestion()}
                  disabled={!questionText.trim() || isQuerying}
                >
                  {isQuerying ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>

              {/* RAG Answer Display */}
              {ragResult && (
                <View style={[styles.answerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.answerCardHeader}>
                    <View style={styles.answerHeaderBadge}>
                      <Ionicons name="sparkles" size={14} color={colors.primary} />
                      <Text style={[styles.answerHeaderTitle, { color: colors.text }]}>Grounded Explanation</Text>
                      {ragResult.language === 'ta' && (
                        <View style={[styles.langTag, { backgroundColor: '#FCE7F3' }]}>
                          <Text style={[styles.langTagText, { color: '#E11D48' }]}>தமிழ்</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.answerActionsRow}>
                      <TouchableOpacity
                        onPress={() => handleSaveToNotes(`Notes: ${activeDocument.filename}`, ragResult.answer)}
                        style={styles.actionIconBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="bookmark" size={18} color={colors.primary} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleShare(`Study Material: ${activeDocument.filename}`, ragResult.answer)}
                        style={styles.actionIconBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="share-social-outline" size={18} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={[styles.answerBodyText, { color: colors.text }]}>{ragResult.answer}</Text>

                  {/* Grounded Source Citations */}
                  {ragResult.sources && ragResult.sources.length > 0 && (
                    <View style={[styles.citationsSection, { borderTopColor: colors.border }]}>
                      <View style={styles.citationsHeader}>
                        <Ionicons name="shield-checkmark" size={12} color={colors.success} />
                        <Text style={[styles.citationsTitle, { color: colors.success }]}>
                          Verified Document Sources (No Hallucination):
                        </Text>
                      </View>
                      {ragResult.sources.map((src, idx) => (
                        <View
                          key={idx}
                          style={[styles.citationItem, { backgroundColor: colors.surfaceSubtle }]}
                        >
                          <View style={styles.citationBadgeRow}>
                            <Text style={styles.citationPageBadge}>
                              Page {src.page_number ?? 1}
                            </Text>
                            <Text style={[styles.citationScore, { color: colors.textMuted }]}>
                              Match: {Math.round(src.similarity * 100)}%
                            </Text>
                          </View>
                          <Text style={[styles.citationSnippet, { color: colors.textSecondary }]}>
                            "{src.snippet}"
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="book-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No document selected</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Please choose a document from the Library tab to start asking questions.
              </Text>
              <TouchableOpacity
                style={[styles.selectDocCta, { backgroundColor: colors.primary }]}
                onPress={() => setActiveTab('library')}
              >
                <Text style={styles.selectDocCtaText}>Go to Library</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      {/* TAB 3: SAVED NOTES */}
      {activeTab === 'notes' && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Saved Study Notes</Text>
            <Text style={[styles.sectionCount, { color: colors.textMuted }]}>{savedNotes.length} notes</Text>
          </View>

          {savedNotes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="bookmark-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No saved notes yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Save AI answers, summaries, and flashcards to view and share them here offline.
              </Text>
            </View>
          ) : (
            savedNotes.map((note) => (
              <View
                key={note.id}
                style={[styles.noteCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={styles.noteCardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.noteTitle, { color: colors.text }]}>{note.title}</Text>
                    <Text style={[styles.noteDate, { color: colors.textMuted }]}>
                      {note.document_name ? `${note.document_name} • ` : ''}
                      {note.created_at}
                    </Text>
                  </View>

                  <View style={styles.noteActionsRow}>
                    <TouchableOpacity
                      onPress={() => handleShare(note.title, note.content)}
                      style={styles.actionIconBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="share-social-outline" size={18} color={colors.primary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => deleteNote(note.id)}
                      style={styles.actionIconBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={[styles.noteBody, { color: colors.textSecondary }]} numberOfLines={6}>
                  {note.content}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* SUMMARIZATION & FLASHCARDS MODAL */}
      <Modal
        visible={showSummaryModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSummaryModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
            <View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Document Summaries & Cards</Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                {activeDocument?.filename}
              </Text>
            </View>

            <TouchableOpacity onPress={() => setShowSummaryModal(false)} style={styles.closeBtn}>
              <Ionicons name="close-circle" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Mode Selector Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modesScroll}>
            {[
              { id: 'quick', label: '⚡ Quick' },
              { id: 'detailed', label: '📑 Detailed' },
              { id: 'exam_notes', label: '🎯 Exam Notes' },
              { id: 'key_points', label: '🔑 Key Points' },
              { id: 'flashcards', label: '🗂️ Flashcards' },
              { id: 'qa', label: '❓ Q&A' },
            ].map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[
                  styles.modeTabBtn,
                  {
                    backgroundColor: summaryMode === m.id ? colors.primary : colors.surface,
                    borderColor: summaryMode === m.id ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => handleRunSummary(m.id as any, summaryLang)}
              >
                <Text
                  style={[
                    styles.modeTabBtnText,
                    { color: summaryMode === m.id ? '#FFFFFF' : colors.text },
                  ]}
                >
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Language Selector for Summaries */}
          <View style={styles.summaryLangRow}>
            <Text style={[styles.summaryLangLabel, { color: colors.textSecondary }]}>Language:</Text>
            {[
              { code: 'en', label: 'English' },
              { code: 'ta', label: 'தமிழ்' },
              { code: 'hi', label: 'हिन्दी' },
            ].map((l) => (
              <TouchableOpacity
                key={l.code}
                style={[
                  styles.summaryLangBtn,
                  {
                    backgroundColor: summaryLang === l.code ? colors.primary + '20' : colors.surface,
                    borderColor: summaryLang === l.code ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => handleRunSummary(summaryMode, l.code as any)}
              >
                <Text
                  style={[
                    styles.summaryLangBtnText,
                    { color: summaryLang === l.code ? colors.primary : colors.text },
                  ]}
                >
                  {l.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Modal Content */}
          <ScrollView contentContainerStyle={styles.modalBody}>
            {isSummarizing ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.modalLoadingText, { color: colors.text }]}>
                  Synthesizing {summaryMode.replace('_', ' ')} breakdown...
                </Text>
              </View>
            ) : summaryResult ? (
              <>
                {/* Flashcards interactive view */}
                {summaryMode === 'flashcards' && summaryResult.flashcards && summaryResult.flashcards.length > 0 ? (
                  <View style={styles.flashcardsContainer}>
                    <Text style={[styles.cardCounter, { color: colors.textMuted }]}>
                      Card {activeFlashcardIndex + 1} of {summaryResult.flashcards.length}
                    </Text>

                    <TouchableOpacity
                      style={[
                        styles.flashcardBox,
                        {
                          backgroundColor: isCardFlipped
                            ? colors.primaryLight
                            : colors.surface,
                          borderColor: colors.primary,
                        },
                      ]}
                      onPress={() => setIsCardFlipped(!isCardFlipped)}
                      activeOpacity={0.9}
                    >
                      <View style={styles.cardHeader}>
                        <Text style={[styles.cardTag, { color: colors.primary }]}>
                          {summaryResult.flashcards[activeFlashcardIndex].concept}
                        </Text>
                        <Text style={[styles.flipHint, { color: colors.textMuted }]}>
                          (Tap to {isCardFlipped ? 'see Question' : 'flip for Answer'})
                        </Text>
                      </View>

                      <Text style={[styles.cardMainText, { color: colors.text }]}>
                        {isCardFlipped
                          ? summaryResult.flashcards[activeFlashcardIndex].back
                          : summaryResult.flashcards[activeFlashcardIndex].front}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.cardNavRow}>
                      <TouchableOpacity
                        style={[
                          styles.cardNavBtn,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                            opacity: activeFlashcardIndex === 0 ? 0.4 : 1,
                          },
                        ]}
                        disabled={activeFlashcardIndex === 0}
                        onPress={() => {
                          setIsCardFlipped(false);
                          setActiveFlashcardIndex((prev) => prev - 1);
                        }}
                      >
                        <Ionicons name="arrow-back" size={18} color={colors.text} />
                        <Text style={[styles.cardNavText, { color: colors.text }]}>Previous</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.cardNavBtn,
                          {
                            backgroundColor: colors.primary,
                            borderColor: colors.primary,
                            opacity:
                              activeFlashcardIndex === summaryResult.flashcards.length - 1 ? 0.4 : 1,
                          },
                        ]}
                        disabled={activeFlashcardIndex === summaryResult.flashcards.length - 1}
                        onPress={() => {
                          setIsCardFlipped(false);
                          setActiveFlashcardIndex((prev) => prev + 1);
                        }}
                      >
                        <Text style={[styles.cardNavText, { color: '#FFFFFF' }]}>Next Card</Text>
                        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : summaryMode === 'qa' && summaryResult.qa_items && summaryResult.qa_items.length > 0 ? (
                  /* Q&A list */
                  <View style={styles.qaListContainer}>
                    {summaryResult.qa_items.map((qa, idx) => (
                      <View
                        key={idx}
                        style={[styles.qaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      >
                        <View style={styles.qaHeader}>
                          <Text style={[styles.qaQuestion, { color: colors.text }]}>
                            Q{idx + 1}: {qa.question}
                          </Text>
                          {qa.page_reference && (
                            <Text style={styles.citationPageBadge}>Page {qa.page_reference}</Text>
                          )}
                        </View>
                        <Text style={[styles.qaAnswer, { color: colors.textSecondary }]}>
                          {qa.answer}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  /* Standard text summary */
                  <View style={[styles.summaryTextBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.summaryText, { color: colors.text }]}>
                      {summaryResult.content}
                    </Text>
                  </View>
                )}

                {/* Bottom Modal Actions: Save & Share */}
                <View style={styles.modalBottomActions}>
                  <TouchableOpacity
                    style={[styles.modalSaveBtn, { backgroundColor: colors.primary }]}
                    onPress={() =>
                      handleSaveToNotes(
                        `${summaryMode.toUpperCase()} - ${activeDocument?.filename}`,
                        summaryResult.content
                      )
                    }
                  >
                    <Ionicons name="bookmark" size={16} color="#FFFFFF" />
                    <Text style={styles.modalSaveBtnText}>Save to Study Notes</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalShareBtn, { borderColor: colors.border }]}
                    onPress={() =>
                      handleShare(
                        `${summaryMode.toUpperCase()} - ${activeDocument?.filename}`,
                        summaryResult.content
                      )
                    }
                  >
                    <Ionicons name="share-social-outline" size={16} color={colors.text} />
                    <Text style={[styles.modalShareBtnText, { color: colors.text }]}>Share</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  uploadHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  uploadHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  tabsWrapper: {
    width: '100%',
    borderBottomWidth: 1,
  },
  tabsRow: {
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  tabItemText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scrollContent: {
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
    padding: 16,
    paddingBottom: 120,
  },
  progressCard: {
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
    margin: 16,
    marginBottom: 0,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  toastSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  toastSuccessText: {
    fontSize: 12,
    fontWeight: '600',
  },
  uploadDropZone: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  uploadCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  uploadDropTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  uploadDropSubtitle: {
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'center',
  },
  supportedPillRow: {
    flexDirection: 'row',
    gap: 6,
  },
  supportedPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  supportedPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  sectionCount: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  selectDocCta: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  selectDocCtaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  docCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  docCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  docIconAndMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  docTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  docTypeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  docFilename: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  docStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  docStatText: {
    fontSize: 11,
  },
  statusDotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotText: {
    fontSize: 9,
    fontWeight: '700',
  },
  trashBtn: {
    padding: 4,
  },
  docActionsBar: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  docActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  docActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  docActionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  docActionBtnSecondaryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeDocBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  activeDocLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  activeDocTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  activeDocSubtitle: {
    fontSize: 11,
  },
  quickSummaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  quickSummaryChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  presetHeader: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
  },
  presetsScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  presetEmoji: {
    fontSize: 12,
  },
  presetText: {
    fontSize: 12,
  },
  queryInputBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: 16,
  },
  queryInput: {
    fontSize: 13,
    minHeight: 50,
    textAlignVertical: 'top',
  },
  sendQueryBtn: {
    alignSelf: 'flex-end',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
  },
  answerCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  answerHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  answerHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  langTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  langTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  answerActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionIconBtn: {
    padding: 2,
  },
  answerBodyText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
  citationsSection: {
    paddingTop: 10,
    borderTopWidth: 1,
  },
  citationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  citationsTitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  citationItem: {
    padding: 8,
    borderRadius: 8,
    marginBottom: 6,
  },
  citationBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  citationPageBadge: {
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: '#EFF6FF',
    color: '#0284C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  citationScore: {
    fontSize: 10,
  },
  citationSnippet: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  noteCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  noteCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  noteDate: {
    fontSize: 10,
    marginTop: 2,
  },
  noteActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  noteBody: {
    fontSize: 12,
    lineHeight: 18,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 11,
  },
  closeBtn: {
    padding: 4,
  },
  modesScroll: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 52,
  },
  modeTabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  modeTabBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  summaryLangRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  summaryLangLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  summaryLangBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  summaryLangBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalBody: {
    padding: 16,
    paddingBottom: 40,
  },
  modalLoading: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  modalLoadingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  flashcardsContainer: {
    alignItems: 'center',
  },
  cardCounter: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
  },
  flashcardBox: {
    width: '100%',
    minHeight: 180,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 20,
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTag: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  flipHint: {
    fontSize: 10,
  },
  cardMainText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    textAlign: 'center',
    marginVertical: 20,
  },
  cardNavRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cardNavBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  cardNavText: {
    fontSize: 13,
    fontWeight: '600',
  },
  qaListContainer: {
    gap: 10,
  },
  qaCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  qaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  qaQuestion: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  qaAnswer: {
    fontSize: 12,
    lineHeight: 18,
  },
  summaryTextBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  summaryText: {
    fontSize: 13,
    lineHeight: 22,
  },
  modalBottomActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalSaveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  modalSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  modalShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  modalShareBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
