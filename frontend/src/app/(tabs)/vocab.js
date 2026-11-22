import ComingSoon from '../../components/ComingSoon';
import { useT } from '../../lib/i18n';

// 단어장 — 담당 화면이 생기면 교체
export default function VocabScreen() {
  const t = useT();
  return <ComingSoon title={t('tabs.vocab')} />;
}
