// 교환일기 상세 (시안: iPhone 13 & 36 보기 / 23·30·31·29 첨삭하기)
// - 내 일기이거나 이미 첨삭된 일기: 본문 + 첨삭 결과를 읽기만 함
// - 아직 첨삭 안 한 친구 일기: 단어/구절을 눌러 고치고, 사전에서 단어 카드를 더해 함께 전달함
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import DearLogo from '../../../components/DearLogo';
import DictionaryModal from '../../../components/DictionaryModal';
import VocabCard from '../../../components/VocabCard';
import { Bell, ChevronLeft } from '../../../components/Icons';
import { api } from '../../../lib/api';
import { errorMessage } from '../../../lib/errorMessage';
import { useLanguage } from '../../../lib/i18n';
import { colors, radius } from '../../../lib/theme';
import { getJSON, setJSON } from '../../../lib/tokenStorage';

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

const TEXT = {
  ko: {
    untitled: '제목 없음',
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
    vocabTitle: '단어 모음',
    feedbackPrompt: (name) => `${name || '상대'}님의 피드백은 어떠셨나요?\n별점을 남겨주세요!`,
    feedbackSubmit: '제출하기',
    feedbackThanks: '소중한 의견 감사해요!',
  },
  ja: {
    untitled: 'タイトルなし',
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
    vocabTitle: '単語集め',
    feedbackPrompt: (name) => `${name || '相手'}さんのフィードバックはどうでしたか?\n評価をしてください!`,
    feedbackSubmit: '送信する',
    feedbackThanks: '貴重なご意見ありがとうございます!',
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

// 읽기 전용 보기: 첨삭 받은 부분(파란색, 고친 표현으로 교체) + 사전으로 찾은 단어(주황색)를 한 텍스트에 합쳐서 보여줌
function buildReadSegments(fullText, corrections, searchWords) {
  const ranges = [];
  corrections.forEach((c) => {
    if (!c.original_text) return;
    const idx = fullText.indexOf(c.original_text);
    if (idx === -1) return;
    ranges.push({ start: idx, end: idx + c.original_text.length, kind: 'correction', text: c.corrected_text });
  });
  (searchWords ?? []).forEach((w) => {
    if (!w) return;
    const idx = fullText.indexOf(w);
    if (idx === -1) return;
    const end = idx + w.length;
    if (ranges.some((r) => idx < r.end && end > r.start)) return; // 첨삭 구간과 겹치면 첨삭 쪽 우선
    ranges.push({ start: idx, end, kind: 'search', text: w });
  });

  ranges.sort((a, b) => a.start - b.start);
  const segs = [];
  let cursor = 0;
  ranges.forEach((r) => {
    if (r.start < cursor) return;
    if (r.start > cursor) segs.push({ kind: 'plain', key: `p-${cursor}`, text: fullText.slice(cursor, r.start), start: cursor });
    segs.push({ kind: r.kind, key: `${r.kind}-${r.start}`, text: r.text, start: r.start });
    cursor = r.end;
  });
  if (cursor < fullText.length) segs.push({ kind: 'plain', key: `p-${cursor}`, text: fullText.slice(cursor), start: cursor });
  return segs;
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

  const needsCorrection = !!diary && !diary.mine && String(diary.status ?? '').toLowerCase() !== 'corrected';

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

      {diary && !needsCorrection && <ReadScreen diary={diary} tx={tx} partner={partner} />}
    </SafeAreaView>
  );
}

// 내 일기이거나 이미 첨삭된 일기: 전체 내용을 보여주되, 첨삭 받은 부분은 파란색(고친 표현으로 교체),
// 사전으로 찾은 단어는 주황색으로 한 화면에 같이 표시함
function ReadScreen({ diary, tx, partner }) {
  const hasTitle = !!diary.title;
  const corrections = diary.corrections ?? [];
  const searchWords = diary.search_words ?? [];
  const hasCorrections = corrections.length > 0;

  // 제목과 본문은 별도 텍스트라서, 각자 안에서 첨삭/사전 단어를 따로 찾는다 (한쪽 글자가 다른 쪽까지 번지지 않게)
  // 원문 카드: 사전 단어(주황)만 표시, 첨삭 전 그대로
  const originalTitleSegments = useMemo(
    () => (hasTitle ? buildReadSegments(diary.title, [], searchWords) : []),
    [hasTitle, diary.title, searchWords],
  );
  const originalBodySegments = useMemo(
    () => buildReadSegments(diary.content, [], searchWords),
    [diary.content, searchWords],
  );
  // 첨삭된 카드: 고친 부분(파랑) + 사전 단어(주황)를 합쳐서 표시
  const titleSegments = useMemo(
    () => (hasTitle ? buildReadSegments(diary.title, corrections, searchWords) : []),
    [hasTitle, diary.title, corrections, searchWords],
  );
  const bodySegments = useMemo(
    () => buildReadSegments(diary.content, corrections, searchWords),
    [diary.content, corrections, searchWords],
  );

  const renderSegments = (segs) =>
    segs.map((seg) => {
      if (seg.kind === 'correction') return <Text key={seg.key} style={styles.correctedInline}>{seg.text}</Text>;
      if (seg.kind === 'search') return <Text key={seg.key} style={styles.searchInline}>{seg.text}</Text>;
      return <Text key={seg.key}>{seg.text}</Text>;
    });

  // 한 번 별점을 남겼으면 다음에 또 안 뜨게 — 기기에만 저장 (서버 전송은 아직 없음)
  const [alreadyRated, setAlreadyRated] = useState(true);
  useEffect(() => {
    let cancelled = false;
    getJSON(`dear.rated.${diary.id}`)
      .then((rated) => !cancelled && setAlreadyRated(!!rated))
      .catch(() => !cancelled && setAlreadyRated(false));
    return () => {
      cancelled = true;
    };
  }, [diary.id]);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {hasCorrections && (
        <View style={styles.paper}>
          <View style={styles.titleBlock}>
            {hasTitle && <Text style={styles.editTitleText}>{renderSegments(originalTitleSegments)}</Text>}
            <Text style={styles.meta}>
              {diary.mine ? tx.me : partner}  {formatDate(diary.created_at)}
            </Text>
          </View>
          <Text style={styles.body}>{renderSegments(originalBodySegments)}</Text>
        </View>
      )}

      <View style={styles.paper}>
        <View style={styles.titleBlock}>
          {hasTitle && <Text style={styles.editTitleText}>{renderSegments(titleSegments)}</Text>}
          <Text style={styles.meta}>
            {diary.mine ? tx.me : partner}  {formatDate(diary.created_at)}
          </Text>
        </View>
        <Text style={styles.body}>{renderSegments(bodySegments)}</Text>
      </View>

      {(diary.vocab ?? []).length > 0 && (
        <>
          <Text style={styles.sectionTitle}>{tx.vocabTitle}</Text>
          <View style={{ gap: 10 }}>
            {diary.vocab.map((v) => (
              <VocabCard key={v.id} item={v} tagLabel={v.pos || null} />
            ))}
          </View>
        </>
      )}

      {diary.mine && hasCorrections && !alreadyRated && <RatingPrompt diaryId={diary.id} partner={partner} tx={tx} />}
    </ScrollView>
  );
}

// 받은 첨삭에 대한 별점 — 관리자가 매칭 궁합을 보려고 모으는 용도라 상대에겐 안 보이고, 지금은 저장 없이 화면만 둠.
// 한 번 제출하면 이 일기에선 기기에 표시를 남겨서 다음에 다시 안 뜨게 한다
function RatingPrompt({ diaryId, partner, tx }) {
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = () => {
    setSubmitted(true);
    setJSON(`dear.rated.${diaryId}`, true).catch(() => {});
  };

  return (
    <View style={styles.ratingBox}>
      <Text style={styles.ratingText}>{tx.feedbackPrompt(partner)}</Text>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => !submitted && setRating(n)} hitSlop={6} accessibilityRole="button">
            <Text style={[styles.star, n <= rating && styles.starFilled]}>★</Text>
          </Pressable>
        ))}
      </View>
      {submitted ? (
        <Text style={styles.ratingThanks}>{tx.feedbackThanks}</Text>
      ) : (
        <Pressable
          onPress={onSubmit}
          disabled={rating === 0}
          style={({ pressed }) => [styles.ratingSubmit, rating === 0 && styles.disabled, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <Text style={styles.ratingSubmitText}>{tx.feedbackSubmit}</Text>
        </Pressable>
      )}
    </View>
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
        <View style={styles.titleBlock}>
          <Text style={styles.paperTitle}>{diary.title || tx.untitled}</Text>
          <Text style={styles.meta}>{formatDate(diary.created_at)}</Text>
        </View>
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
  const [correctedFocused, setCorrectedFocused] = useState(false);
  const [explanationFocused, setExplanationFocused] = useState(false);

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
            onFocus={() => setCorrectedFocused(true)}
            onBlur={() => setCorrectedFocused(false)}
            placeholder={tx.correctedPlaceholder}
            placeholderTextColor={colors.placeholder}
            style={[styles.input, correctedFocused && styles.inputFocused]}
            autoFocus
          />

          <Text style={styles.fieldLabel}>{tx.explanationLabel}</Text>
          <TextInput
            value={explanation}
            onChangeText={setExplanation}
            onFocus={() => setExplanationFocused(true)}
            onBlur={() => setExplanationFocused(false)}
            placeholder={tx.explanationPlaceholder}
            placeholderTextColor={colors.placeholder}
            style={[styles.input, explanationFocused && styles.inputFocused]}
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
  paperTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  titleBlock: { paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  meta: { fontSize: 10, color: colors.placeholder, marginTop: 4 },
  body: { marginTop: 10, fontSize: 13, lineHeight: 21, color: colors.text, fontWeight: '400' },
  error: { margin: 18, fontSize: 12, color: colors.error },

  editPaper: { borderWidth: 1.5, borderColor: 'transparent' },
  editPaperActive: { borderColor: colors.primary },
  editTitleText: { fontSize: 17, fontWeight: '700', color: colors.text },
  selectedToken: { backgroundColor: '#DCE8F6' },
  correctedInline: { color: colors.correction, fontWeight: '600' },
  searchInline: { color: colors.highlight, fontWeight: '600' },

  selectionBar: { flexDirection: 'row', gap: 10, marginTop: -4 },
  smallBtn: { height: 40, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  smallBtnText: { fontSize: 13, color: colors.primaryText, fontWeight: '600' },
  smallBtnGhost: { backgroundColor: colors.subtleButton },
  smallBtnGhostText: { fontSize: 13, color: colors.text, fontWeight: '600' },
  smallBtnDanger: { backgroundColor: '#F7E1E0' },
  smallBtnDangerText: { fontSize: 13, color: colors.error, fontWeight: '600' },

  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.text, marginTop: 4 },
  ratingBox: { marginTop: 10, alignItems: 'center', gap: 12, paddingVertical: 8 },
  ratingText: { fontSize: 13, color: colors.text, textAlign: 'center', lineHeight: 19 },
  starsRow: { flexDirection: 'row', gap: 6 },
  star: { fontSize: 26, color: colors.placeholder },
  starFilled: { color: '#F2B705' },
  ratingSubmit: {
    height: 40, minWidth: 140, borderRadius: radius.pill, backgroundColor: colors.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28,
  },
  ratingSubmitText: { fontSize: 13, color: colors.primaryText, fontWeight: '600', textAlign: 'center', marginTop: -1 },
  ratingThanks: { fontSize: 12, color: colors.placeholder },
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
    height: 40, borderRadius: radius.input, backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#E9E3E2',
    paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: colors.text,
    ...Platform.select({ web: { outlineStyle: 'none' }, default: {} }),
  },
  inputFocused: { borderColor: colors.border },
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
});
