// 일기 작성 화면(P-007)에서 쓰는 입력 검사 훅 (FR-010, 담당: 강태인)
//
// 사용 예 (일기 작성 담당: 강하윤)
//   const [content, setContent] = useState('');
//   const check = useDiaryInputCheck(content, learningLang);   // learningLang: 'ja' | 'ko'
//   <TextInput value={content} onChangeText={setContent} multiline />   ← 입력은 막지 않음
//   <LanguageCheckNotice lang={learningLang} check={check} />
//   <Button title="보내기" disabled={!check.canSend} ... />
import { useMemo } from 'react';
import { checkDiaryInput } from '../lib/languageCheck';

export default function useDiaryInputCheck(content, lang) {
  return useMemo(() => checkDiaryInput(content ?? '', lang), [content, lang]);
}
