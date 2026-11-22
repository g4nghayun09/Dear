// 일기 작성 화면(P-007)에서 쓰는 입력 검사 훅 (FR-010, 담당: 강태인)
//
// 사용 예 (일기 작성 담당: 강하윤)
//   const { profile } = useAuth();
//   const lang = learningLang(profile.native_lang);          // 'ja' | 'ko'
//   const [content, setContent] = useState('');
//   const check = useDiaryInputCheck(content, lang);
//   <TextInput value={content} onChangeText={setContent} multiline />   ← 입력은 막지 않음
//   <LanguageCheckNotice lang={lang} check={check} />
//   <Pressable disabled={!check.canSend} onPress={send}>…</Pressable>
import { useMemo } from 'react';
import { checkDiaryInput } from './languageCheck';

export default function useDiaryInputCheck(content, lang) {
  return useMemo(() => checkDiaryInput(content, lang), [content, lang]);
}
