// 교환일기 상세 (시안: iPhone 13 & 36 보기 / 23·30·31·29 첨삭하기)
// - 내 일기이거나 이미 첨삭된 일기: 본문 + 첨삭 결과를 읽기만 함
// - 아직 첨삭 안 한 친구 일기: 단어/구절을 눌러 고치고, 사전에서 단어 카드를 더해 함께 전달함
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import DearLogo from '../../../components/DearLogo';
import DictionaryModal from '../../../components/DictionaryModal';
import { Bell, ChevronLeft } from '../../../components/Icons';
import { api } from '../../../lib/api';
import { errorMessage } from '../../../lib/errorMessage';
import { useLanguage } from '../../../lib/i18n';
import { colors, radius } from '../../../lib/theme';

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

const TEXT = {
  ko: {
    untitled: '제목 없음',
    corrections: '첨삭',
    me: '나',
    correctHint: '피드백을 줄 부분을 고치고 단어를 추가해 주세요',
    fixAction: '고치기',
    cancelAction: '취소',
    editTitle: '고쳐 쓰기',
    originalLabel: '원래 표현',
    correctedLabel: '고친 표현',
    correctedPlaceholder: '올바른 표현으로 고쳐 주세요',
    explanationLabel: '설명 (선택)',
    explanationPlaceholder: '왜 고쳤는지 설명해 주세요',
    save: '저장',
    deleteAction: '삭제',
    wordCardsTitle: '단어 카드 전달하기',
    dictionaryButton: '사전 찾아보기',
    submit: '전달하기',
  },
  ja: {
    untitled: 'タイトルなし',
    corrections: '添削',
    me: '自分',
    correctHint: 'フィードバックする部分を直して、単語を追加してください',
    fixAction: '直す',
    cancelAction: 'キャンセル',
    editTitle: '書き直す',
    originalLabel: '元の表現',
    correctedLabel: '直した表現',
    correctedPlaceholder: '正しい表現に直してください',
    explanationLabel: '説明（任意）',
    explanationPlaceholder: 'なぜ直したのか説明してください',
    save: '保存',
    deleteAction: '削除',
    wordCardsTitle: '単語カードを届ける',
    dictionaryButton: '辞書で調べる',
    submit: '届ける',
  },
};

// 일기 본문을 "탭으로 선택 가능한" 조각으로 나눔. 한국어는 단어 단위(공백 기준), 일본어는 글자 단위(띄어쓰기가 없어서)
function tokenizeContent(text, mode) {
  const tokens = [];
  if (mode === 'word') {
    const re = /\n|[^\S\n]+|\S+/g;
    let m;
    while ((m = re.exec(text))) {
      const raw = m[0];
      const start = m.index;
      const type = raw === '\n' ? 'break' : /^[^\S\n]+$/.test(raw) ? 'space' : 'word';
      tokens.push({ type, start, end: start + raw.length, text: raw });
    }
  } else {
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      tokens.push({ type: ch === '\n' ? 'break' : 'char', start: i, end: i + 1, text: ch });
    }
  }
  return tokens;
}

// 확정된 첨삭(교정) 구간은 통째로 하나의 조각으로, 나머지는 토큰별로 나눠서 렌더링 목록을 만듦
function buildSegments(contentLength, tokens, corrections, activeSel) {
  const segs = [];
  const sorted = [...corrections].sort((a, b) => a.start - b.start);
  let cursor = 0;

  const pushRange = (from, to) => {
    tokens.forEach((tok) => {
      if (tok.start < from || tok.end > to) return;
      if (tok.type === 'word' || tok.type === 'char') {
        const selected = !!activeSel && tok.start < activeSel.end && tok.end > activeSel.start;
        segs.push({ kind: 'token', key: `t-${tok.start}`, tok, selected });
      } else {
        segs.push({ kind: 'plain', key: `p-${tok.start}`, text: tok.text, start: tok.start });
      }
    });
  };

  sorted.forEach((c) => {
    pushRange(cursor, c.start);
    segs.push({ kind: 'correction', key: `c-${c.id}`, correction: c });
    cursor = c.end;
  });
  pushRange(cursor, contentLength);
  return segs;
}

export default function DiaryDetailScreen() {
  const { id, partner } = useLocalSearchParams();
  const [uiLang] = useLanguage();
  const tx = TEXT[uiLang] ?? TEXT.ko;
  const [diary, setDiary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .getDiary(id)
      .then((d) => {
        if (cancelled) return;
        setDiary(d);
        // 친구 일기를 처음 열면 읽음 표시 (서버에 아직 없으면 조용히 넘어감)
        if (d && !d.mine && !d.read_at) api.markDiaryRead?.(id)?.catch?.(() => {});
      })
      .catch((e) => !cancelled && setError(errorMessage(e)));
    return () => {
      cancelled = true;
    };
  }, [id]);

  const corrections = diary?.corrections ?? [];
  const needsCorrection = !!diary && !diary.mine && diary.status !== 'corrected';

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <DearLogo width={64} />
        <Bell />
      </View>

      <Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button">
        <ChevronLeft />
        <Text style={styles.backTitle} numberOfLines={1}>{diary?.title || tx.untitled}</Text>
      </Pressable>

      {!diary && !error && <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />}
      {!!error && <Text style={styles.error}>{error}</Text>}

      {diary && needsCorrection && <CorrectScreen diary={diary} tx={tx} />}

      {diary && !needsCorrection && (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.paper}>
            <Text style={styles.paperTitle}>{diary.title || tx.untitled}</Text>
            <Text style={styles.meta}>
              {diary.mine ? tx.me : partner}  {formatDate(diary.created_at)}
            </Text>
            <Text style={styles.body}>{diary.content}</Text>
          </View>

          {corrections.length > 0 && (
            <View style={styles.paper}>
              <Text style={styles.paperTitle}>{tx.corrections}</Text>
              {corrections.map((c) => (
                <View key={c.id} style={styles.correction}>
                  <Text style={styles.original}>{c.original_text}</Text>
                  <Text style={styles.fixed}>→ {c.corrected_text}</Text>
                  {!!c.explanation && <Text style={styles.explain}>{c.explanation}</Text>}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// 아직 첨삭하지 않은 친구 일기: 원문 + (단어/구절을 눌러 고치는) 편집용 미리보기 + 단어 카드 + 전달하기
function CorrectScreen({ diary, tx }) {
  const tokenMode = diary.language === 'ko' ? 'word' : 'char';
  // 제목도 고칠 수 있도록, 제목+본문을 하나의 좌표(글자 위치)로 이어 붙여서 다룸 (실제 줄바꿈 글자는 화면엔 안 보이고 위치 계산에만 씀)
  const hasTitle = !!diary.title;
  const fullText = hasTitle ? `${diary.title}\n${diary.content}` : diary.content;
  const titleLen = hasTitle ? diary.title.length : 0;
  const tokens = useMemo(() => tokenizeContent(fullText, tokenMode), [fullText, tokenMode]);

  const [corrections, setCorrections] = useState([]); // { id, start, end, original_text, corrected_text, explanation } — start/end는 fullText 기준
  const [anchor, setAnchor] = useState(null); // 첫 번째로 누른 토큰 { start, end }
  const [range, setRange] = useState(null); // 두 번째 탭까지 끝나서 확정된 선택 범위 { start, end }
  const [editing, setEditing] = useState(null); // 편집 모달에 띄울 대상: { start, end, original_text, corrected_text, explanation, existingId? }

  const [wordCards, setWordCards] = useState([]);
  const [dictOpen, setDictOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const activeSel = range ?? anchor;
  const segments = useMemo(
    () => buildSegments(fullText.length, tokens, corrections, activeSel),
    [fullText.length, tokens, corrections, activeSel],
  );
  // 제목 구간(위치 < titleLen)과 본문 구간(위치 > titleLen, 그 사이 줄바꿈 글자 하나는 건너뜀)으로 나눠서 렌더링
  const segStart = (s) => (s.kind === 'token' ? s.tok.start : s.kind === 'correction' ? s.correction.start : s.start);
  const titleSegments = hasTitle ? segments.filter((s) => segStart(s) < titleLen) : [];
  const bodySegments = hasTitle ? segments.filter((s) => segStart(s) > titleLen) : segments;

  const onTokenPress = (tok) => {
    if (!anchor || range) {
      setAnchor({ start: tok.start, end: tok.end });
      setRange(null);
      return;
    }
    setRange({ start: Math.min(anchor.start, tok.start), end: Math.max(anchor.end, tok.end) });
  };

  const clearSelection = () => {
    setAnchor(null);
    setRange(null);
  };

  const openEditForSelection = () => {
    if (!range) return;
    setEditing({ start: range.start, end: range.end, original_text: fullText.slice(range.start, range.end), corrected_text: '', explanation: '' });
  };

  const openEditForExisting = (c) => {
    setEditing({ start: c.start, end: c.end, original_text: c.original_text, corrected_text: c.corrected_text, explanation: c.explanation ?? '', existingId: c.id });
  };

  const saveEditing = (corrected_text, explanation) => {
    setCorrections((prev) => {
      const next = editing.existingId ? prev.filter((c) => c.id !== editing.existingId) : prev;
      return [
        ...next,
        { id: editing.existingId ?? `local-${editing.start}-${Date.now()}`, start: editing.start, end: editing.end, original_text: editing.original_text, corrected_text, explanation: explanation || null },
      ];
    });
    setEditing(null);
    clearSelection();
  };

  const deleteEditing = () => {
    if (editing?.existingId) setCorrections((prev) => prev.filter((c) => c.id !== editing.existingId));
    setEditing(null);
  };

  const onPickWord = (item) => {
    setWordCards((prev) => (prev.some((w) => w.term === item.term) ? prev : [...prev, item]));
    setDictOpen(false);
  };

  const removeWordCard = (term) => setWordCards((prev) => prev.filter((w) => w.term !== term));

  const renderSegments = (segs) =>
    segs.map((seg) => {
      if (seg.kind === 'plain') return <Text key={seg.key}>{seg.text}</Text>;
      if (seg.kind === 'correction') {
        return (
          <Text key={seg.key} onPress={() => openEditForExisting(seg.correction)} style={styles.correctedInline}>
            {seg.correction.corrected_text}
          </Text>
        );
      }
      return (
        <Text key={seg.key} onPress={() => onTokenPress(seg.tok)} style={seg.selected ? styles.selectedToken : null}>
          {seg.tok.text}
        </Text>
      );
    });

  const onSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const items = corrections.map((c) => ({ original_text: c.original_text, corrected_text: c.corrected_text, explanation: c.explanation }));
      await api.submitCorrections(diary.id, items, wordCards);
      router.back();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.hint}>{tx.correctHint}</Text>

      <View style={styles.paper}>
        <Text style={styles.paperTitle}>{diary.title || tx.untitled}</Text>
        <Text style={styles.meta}>{formatDate(diary.created_at)}</Text>
        <Text style={styles.body}>{diary.content}</Text>
      </View>

      <View style={[styles.paper, styles.editPaper, !!range && styles.editPaperActive]}>
        {hasTitle && <Text style={styles.editTitleText}>{renderSegments(titleSegments)}</Text>}
        <Text style={styles.body}>{renderSegments(bodySegments)}</Text>
      </View>

      {!!range && (
        <View style={styles.selectionBar}>
          <Pressable onPress={clearSelection} style={({ pressed }) => [styles.smallBtn, styles.smallBtnGhost, pressed && styles.pressed]} accessibilityRole="button">
            <Text style={styles.smallBtnGhostText}>{tx.cancelAction}</Text>
          </Pressable>
          <Pressable onPress={openEditForSelection} style={({ pressed }) => [styles.smallBtn, pressed && styles.pressed]} accessibilityRole="button">
            <Text style={styles.smallBtnText}>{tx.fixAction}</Text>
          </Pressable>
        </View>
      )}

      <Text style={styles.sectionTitle}>{tx.wordCardsTitle}</Text>
      {wordCards.length > 0 && (
        <View style={styles.wordCardRow}>
          {wordCards.map((w) => (
            <Pressable key={w.term} onPress={() => removeWordCard(w.term)} style={styles.wordCard} accessibilityRole="button">
              <Text style={styles.wordCardText}>{w.term} ✕</Text>
            </Pressable>
          ))}
        </View>
      )}
      <Pressable onPress={() => setDictOpen(true)} style={({ pressed }) => [styles.dictButton, pressed && styles.pressed]} accessibilityRole="button">
        <Text style={styles.dictButtonText}>{tx.dictionaryButton}</Text>
      </Pressable>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        onPress={onSubmit}
        disabled={submitting}
        style={({ pressed }) => [styles.submitButton, pressed && styles.pressed, submitting && styles.disabled]}
        accessibilityRole="button"
      >
        {submitting ? <ActivityIndicator color={colors.primaryText} /> : <Text style={styles.submitButtonText}>{tx.submit}</Text>}
      </Pressable>

      <DictionaryModal visible={dictOpen} lang={diary.language} onPick={onPickWord} onClose={() => setDictOpen(false)} />

      <CorrectionEditModal visible={!!editing} editing={editing} tx={tx} onCancel={() => setEditing(null)} onSave={saveEditing} onDelete={editing?.existingId ? deleteEditing : undefined} />
    </ScrollView>
  );
}

// 선택한 구절을 고쳐 쓰고 설명을 다는 모달 (새로 고치기 / 이미 고친 것 다시 편집·삭제 겸용)
function CorrectionEditModal({ visible, editing, tx, onCancel, onSave, onDelete }) {
  const [corrected, setCorrected] = useState('');
  const [explanation, setExplanation] = useState('');

  useEffect(() => {
    if (!visible) return;
    setCorrected(editing?.corrected_text ?? '');
    setExplanation(editing?.explanation ?? '');
  }, [visible, editing]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{tx.editTitle}</Text>

          <Text style={styles.fieldLabel}>{tx.originalLabel}</Text>
          <Text style={styles.originalPreview}>{editing?.original_text}</Text>

          <Text style={styles.fieldLabel}>{tx.correctedLabel}</Text>
          <TextInput
            value={corrected}
            onChangeText={setCorrected}
            placeholder={tx.correctedPlaceholder}
            placeholderTextColor={colors.placeholder}
            style={styles.input}
            multiline
            autoFocus
          />

          <Text style={styles.fieldLabel}>{tx.explanationLabel}</Text>
          <TextInput
            value={explanation}
            onChangeText={setExplanation}
            placeholder={tx.explanationPlaceholder}
            placeholderTextColor={colors.placeholder}
            style={[styles.input, styles.inputMultiline]}
            multiline
          />

          <View style={styles.sheetActions}>
            <Pressable onPress={onCancel} style={({ pressed }) => [styles.smallBtn, styles.smallBtnGhost, styles.flex, pressed && styles.pressed]} accessibilityRole="button">
              <Text style={styles.smallBtnGhostText}>{tx.cancelAction}</Text>
            </Pressable>
            {onDelete && (
              <Pressable onPress={onDelete} style={({ pressed }) => [styles.smallBtn, styles.smallBtnDanger, styles.flex, pressed && styles.pressed]} accessibilityRole="button">
                <Text style={styles.smallBtnDangerText}>{tx.deleteAction}</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => corrected.trim() && onSave(corrected.trim(), explanation.trim())}
              disabled={!corrected.trim()}
              style={({ pressed }) => [styles.smallBtn, styles.flex, pressed && styles.pressed, !corrected.trim() && styles.disabled]}
              accessibilityRole="button"
            >
              <Text style={styles.smallBtnText}>{tx.save}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  pressed: { opacity: 0.6 },
  disabled: { opacity: 0.4 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 22 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingTop: 22, paddingBottom: 12 },
  backTitle: { flex: 1, fontSize: 14, color: colors.text },
  content: { paddingHorizontal: 18, paddingBottom: 24, gap: 14 },
  hint: { fontSize: 12, color: colors.placeholder },
  paper: { backgroundColor: colors.paper, borderRadius: 14, padding: 20, gap: 6 },
  paperTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  meta: { fontSize: 10, color: colors.placeholder },
  body: { marginTop: 10, fontSize: 13, lineHeight: 21, color: colors.text },
  correction: { marginTop: 8, gap: 2 },
  original: { fontSize: 12, color: colors.placeholder, textDecorationLine: 'line-through' },
  fixed: { fontSize: 13, color: colors.highlight },
  explain: { fontSize: 11, color: colors.text },
  error: { margin: 18, fontSize: 12, color: colors.error },

  editPaper: { borderWidth: 1.5, borderColor: 'transparent' },
  editPaperActive: { borderColor: colors.primary },
  editTitleText: { fontSize: 14, fontWeight: '700', color: colors.text },
  selectedToken: { backgroundColor: '#DCE8F6' },
  correctedInline: { color: colors.highlight, fontWeight: '600' },

  selectionBar: { flexDirection: 'row', gap: 10, marginTop: -4 },
  smallBtn: { height: 40, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  smallBtnText: { fontSize: 13, color: colors.primaryText, fontWeight: '600' },
  smallBtnGhost: { backgroundColor: colors.subtleButton },
  smallBtnGhostText: { fontSize: 13, color: colors.text, fontWeight: '600' },
  smallBtnDanger: { backgroundColor: '#F7E1E0' },
  smallBtnDangerText: { fontSize: 13, color: colors.error, fontWeight: '600' },

  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.text, marginTop: 4 },
  wordCardRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  wordCard: { backgroundColor: '#DCE8F6', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  wordCardText: { fontSize: 12, color: colors.text },
  dictButton: { height: 44, borderRadius: 10, borderWidth: 1, borderColor: '#E2DADA', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  dictButtonText: { fontSize: 13, color: colors.text },

  submitButton: { height: 52, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  submitButtonText: { fontSize: 14, color: colors.primaryText, fontWeight: '600' },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  sheet: { width: '100%', maxWidth: 360, backgroundColor: '#fff', borderRadius: 16, padding: 18, gap: 8 },
  sheetTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 4 },
  fieldLabel: { fontSize: 11, color: colors.placeholder, marginTop: 6 },
  originalPreview: { fontSize: 13, color: colors.placeholder, textDecorationLine: 'line-through' },
  input: {
    minHeight: 44, borderWidth: 1, borderColor: colors.border, borderRadius: radius.input,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: colors.text, textAlignVertical: 'top',
  },
  inputMultiline: { minHeight: 60 },
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
});
