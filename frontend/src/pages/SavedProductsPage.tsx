import { useMemo } from 'react';
import { Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import SavedProductsPanel from '../components/SavedProductsPanel';
import { useHighlight } from '../hooks/useHighlight';
import { useCompareReport } from '../hooks/useReport';
import { useSavedProducts } from '../hooks/useSavedProducts';
import type { SavedProductStats } from '../types';

const { Title } = Typography;

export default function SavedProductsPage() {
  const navigate = useNavigate();
  const { highlightedSet, addHighlight } = useHighlight();
  const {
    savedProducts,
    toggleSavedProduct,
    isLoading: isSavedProductsLoading,
  } = useSavedProducts();
  const { data: compareData } = useCompareReport();

  const statsBySubId = useMemo(() => {
    const stats: Record<string, SavedProductStats> = {};

    for (const record of compareData?.records ?? []) {
      if (!stats[record.subId]) {
        stats[record.subId] = {
          tcp: record.tcp,
          tdt: record.tdt,
          hq: record.tcp > 0 ? (record.tdt / record.tcp) * 100 : 0,
        };
      }
    }

    return stats;
  }, [compareData?.records]);

  const handleSelect = (subId2: string) => {
    void addHighlight(subId2);
    navigate('/report');
  };

  return (
    <div className="space-y-4">
      <Title level={3} style={{ margin: 0 }}>
        Danh sách mã hàng đã lưu
      </Title>
      <SavedProductsPanel
        items={savedProducts}
        highlightedSet={highlightedSet}
        statsBySubId={statsBySubId}
        loading={isSavedProductsLoading}
        onSelect={handleSelect}
        onToggleSave={(subId2) => {
          void toggleSavedProduct(subId2);
        }}
      />
    </div>
  );
}