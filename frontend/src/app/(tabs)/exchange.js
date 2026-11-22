import ComingSoon from '../../components/ComingSoon';
import { useT } from '../../lib/i18n';

// 교환일기 (받은 일기 목록·첨삭) — 담당 화면이 생기면 교체
export default function ExchangeScreen() {
  const t = useT();
  return <ComingSoon title={t('tabs.exchange')} />;
}
