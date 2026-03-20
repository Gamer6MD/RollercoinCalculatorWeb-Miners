import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';

interface MinerData {
  [key: string]: string | number | undefined;
  powerRatio?: number;
  bonusRatio?: number;
  efficiency?: number;
  xpRatio?: number;
}

interface FilterState {
  levels: number[];
  market: boolean[];
  powerMin: number | null;
  powerMax: number | null;
  bonusMin: number | null;
  bonusMax: number | null;
  priceMin: number | null;
  priceMax: number | null;
  xpMin: number | null;
  xpMax: number | null;
  ghrltMin: number | null;
  ghrltMax: number | null;
  perrltMin: number | null;
  perrltMax: number | null;
  effMin: number | null;
  effMax: number | null;
  xprltMin: number | null;
  xprltMax: number | null;
}

const defaultFilters: FilterState = {
  levels: [], market: [],
  powerMin: null, powerMax: null,
  bonusMin: null, bonusMax: null,
  priceMin: null, priceMax: null,
  xpMin: null, xpMax: null,
  ghrltMin: null, ghrltMax: null,
  perrltMin: null, perrltMax: null,
  effMin: null, effMax: null,
  xprltMin: null, xprltMax: null
};

interface Translations {
  headerTitle: string;
  headerSubtitle: string;
  backToMain: string;
  uploadTitle: string;
  uploadText: string;
  selectFile: string;
  autoLoadMsg: string;
  filters: string;
  reset: string;
  level: string;
  canBeSold: string;
  yes: string;
  no: string;
  power: string;
  bonus: string;
  price: string;
  xp: string;
  ghrlt: string;
  perrlt: string;
  efficiency: string;
  xprlt: string;
  applyFilters: string;
  minersFound: string;
  searchPlaceholder: string;
  columns: string;
  showHideColumns: string;
  loadAnotherFile: string;
  noResults: string;
  loadingData: string;
}

const translations: Record<string, Translations> = {
  en: {
    headerTitle: 'Merge Calculator Pro',
    headerSubtitle: 'Analyze profitability and efficiency of RollerCoin resources.',
    backToMain: 'Back to Main',
    uploadTitle: 'Upload CSV File',
    uploadText: 'Drag calcul_merge_rollercoin_GH.csv here or click to browse.',
    selectFile: 'Select File',
    autoLoadMsg: 'CSV file loaded automatically',
    filters: 'Filters',
    reset: 'Resetează',
    level: 'Level:',
    canBeSold: 'Can be sold:',
    yes: 'Yes',
    no: 'No',
    power: 'Power (GH/s)',
    bonus: 'Bonus %',
    price: 'Price (RLT)',
    xp: 'XP',
    ghrlt: 'GH/RLT',
    perrlt: '%/RLT',
    efficiency: 'Efficiency',
    xprlt: 'XP/RLT',
    applyFilters: 'Apply Filters',
    minersFound: 'miners found.',
    searchPlaceholder: 'Search a miner...',
    columns: 'Columns',
    showHideColumns: 'Show/Hide Columns',
    loadAnotherFile: 'Load Another File',
    noResults: 'No results found.',
    loadingData: 'Loading data...'
  },
  tr: {
    headerTitle: 'Birleştirme Hesaplayıcı Pro',
    headerSubtitle: 'RollerCoin kaynaklarının karlılığını ve verimliliğini analiz edin.',
    backToMain: 'Ana Sayfaya Dön',
    uploadTitle: 'CSV Dosyası Yükle',
    uploadText: 'calcul_merge_rollercoin_GH.csv dosyasını buraya sürükleyin veya tıklayın.',
    selectFile: 'Dosya Seç',
    autoLoadMsg: 'CSV dosyası otomatik yüklendi',
    filters: 'Filtreler',
    reset: 'Sıfırla',
    level: 'Seviye:',
    canBeSold: 'Satılabilir:',
    yes: 'Evet',
    no: 'Hayır',
    power: 'Güç (GH/s)',
    bonus: 'Bonus %',
    price: 'Fiyat (RLT)',
    xp: 'XP',
    ghrlt: 'GH/RLT',
    perrlt: '%/RLT',
    efficiency: 'Verimlilik',
    xprlt: 'XP/RLT',
    applyFilters: 'Filtreleri Uygula',
    minersFound: 'madeni bulundu.',
    searchPlaceholder: 'Madeni ara...',
    columns: 'Kolonlar',
    showHideColumns: 'Kolonları Göster/Gizle',
    loadAnotherFile: 'Başka Dosya Yükle',
    noResults: 'Sonuç bulunamadı.',
    loadingData: 'Veriler yükleniyor...'
  }
};

const columnLabels: Record<string, Record<string, string>> = {
  en: {
    'col-power': 'Power (GH/s)',
    'col-bonus': 'Bonus %',
    'col-price': 'Price',
    'col-ghrlt': 'GH/RLT',
    'col-perrlt': '%/RLT',
    'col-efficiency': 'Efficiency',
    'col-xprlt': 'XP/RLT',
    'col-xp': 'XP',
    'col-market': 'Market',
    'col-ingredients': 'Ingredients'
  },
  tr: {
    'col-power': 'Güç (GH/s)',
    'col-bonus': 'Bonus %',
    'col-price': 'Fiyat',
    'col-ghrlt': 'GH/RLT',
    'col-perrlt': '%/RLT',
    'col-efficiency': 'Verimlilik',
    'col-xprlt': 'XP/RLT',
    'col-xp': 'XP',
    'col-market': 'Market',
    'col-ingredients': 'Malzemeler'
  }
};

const MergeCalculator: React.FC = () => {
  const { lang } = useParams<{ lang: string }>();
  const currentLang = lang || 'en';
  const t = translations[currentLang] || translations.en;
  
  const getColumnLabel = (colId: string): string => {
    return columnLabels[currentLang]?.[colId] || columnLabels.en[colId];
  };
  
  const [globalData, setGlobalData] = useState<MinerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [showAutoLoadMsg, setShowAutoLoadMsg] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [currentSort, setCurrentSort] = useState<{ column: string; asc: boolean }>({ column: 'efficiency', asc: false });
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set([
    'col-power', 'col-bonus', 'col-price', 'col-ghrlt', 'col-perrlt', 'col-efficiency', 'col-xprlt', 'col-xp', 'col-market', 'col-ingredients'
  ]));
  const [columnDropdownOpen, setColumnDropdownOpen] = useState(false);
  const [rowCount, setRowCount] = useState(0);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(defaultFilters);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  const [sliderRanges, setSliderRanges] = useState({
    power: { min: 0, max: 100000000 },
    bonus: { min: 0, max: 100 },
    price: { min: 0, max: 100000 },
    xp: { min: 0, max: 1000000 },
    ghrlt: { min: 0, max: 10000 },
    perrlt: { min: 0, max: 1 },
    eff: { min: 0, max: 1000 },
    xprlt: { min: 0, max: 1000 }
  });

  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [sliderValues, setSliderValues] = useState({ ...sliderRanges });

  useEffect(() => {
    fetch('/calcul_merge_rollercoin_GH.csv')
      .then(res => { if (res.ok) return res.text(); throw new Error('Not found'); })
      .then(text => { parseCSVData(text); setShowAutoLoadMsg(true); setTimeout(() => setShowAutoLoadMsg(false), 5000); })
      .catch(() => setShowUpload(true))
      .finally(() => setLoading(false));
  }, []);

  const initSliderRanges = (data: MinerData[]) => {
    if (!data.length) return;
    let pm = 0, bm = 0, prm = 0, xm = 0, gm = 0, pem = 0, em = 0, xrm = 0;
    data.forEach(r => {
      const p = (r['Putere Rezultat (GH/s)'] as number) || 0;
      const b = (r['Bonus Rezultat %'] as number) || 0;
      const pr = (r['Cost RLT/RST'] as number) || 0;
      const x = (r['XP Reward'] as number) || 0;
      const g = r.powerRatio || 0;
      const pe = r.bonusRatio || 0;
      const e = r.efficiency || 0;
      const xr = r.xpRatio || 0;
      if (p > pm) pm = p; if (b > bm) bm = b; if (pr > prm) prm = pr;
      if (x > xm) xm = x; if (g > gm) gm = g; if (pe > pem) pem = pe;
      if (e > em) em = e; if (xr > xrm) xrm = xr;
    });
    const nr = {
      power: { min: 0, max: Math.ceil(pm / 1e7) * 1e7 || 1e8 },
      bonus: { min: 0, max: Math.ceil(bm / 10) * 10 || 100 },
      price: { min: 0, max: Math.ceil(prm / 1e4) * 1e4 || 1e5 },
      xp: { min: 0, max: Math.ceil(xm / 1e5) * 1e5 || 1e6 },
      ghrlt: { min: 0, max: Math.ceil(gm / 1e3) * 1e3 || 1e4 },
      perrlt: { min: 0, max: Math.ceil(pem / 0.1) * 0.1 || 1 },
      eff: { min: 0, max: Math.ceil(em / 100) * 100 || 1e3 },
      xprlt: { min: 0, max: Math.ceil(xrm / 100) * 100 || 1e3 }
    };
    setSliderRanges(nr);
    setSliderValues(nr);
  };

  const parseCSVData = (text: string) => {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) return;
    const h = lines[0].split(',').map(s => s.trim());
    const data: MinerData[] = [];
    for (let i = 1; i < lines.length; i++) {
      const row: string[] = []; let inQ = false; let v = '';
      for (let c of lines[i]) { if (c === '"') inQ = !inQ; else if (c === ',' && !inQ) { row.push(v.trim()); v = ''; } else v += c; }
      row.push(v.trim());
      const obj: MinerData = {};
      h.forEach((k, idx) => { const val = row[idx] || ''; obj[k] = (val && !isNaN(Number(val))) ? Number(val) : val; });
      const p = (obj['Putere Rezultat (GH/s)'] as number) || 0;
      const b = (obj['Bonus Rezultat %'] as number) || 0;
      const pr = (obj['Cost RLT/RST'] as number) || 0;
      const x = (obj['XP Reward'] as number) || 0;
      obj.powerRatio = pr > 0 ? p / pr : 0;
      obj.bonusRatio = pr > 0 ? b / pr : 0;
      obj.efficiency = (p / 1e6) + (b * 5.28);
      obj.xpRatio = pr > 0 ? x / pr : 0;
      data.push(obj);
    }
    const sd = data.sort((a, b) => (b.efficiency || 0) - (a.efficiency || 0));
    setGlobalData(sd);
    setShowUpload(false);
    initSliderRanges(sd);
  };

  const handleFile = (f: File) => {
    if (!f.name.endsWith('.csv')) { alert('Please upload CSV'); return; }
    const r = new FileReader();
    r.onload = e => { if (e.target?.result) parseCSVData(e.target.result as string); };
    r.readAsText(f);
  };

  const resetData = () => { 
    setGlobalData([]); 
    setShowUpload(true); 
    setSearchValue(''); 
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setSliderValues(sliderRanges);
  };

  const applyAllFilters = () => {
    setAppliedFilters({...filters});
  };

  const fmt = (n: number | undefined, d = 2): string => { if (n === undefined || n === null || isNaN(n)) return '0'; return n.toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: n % 1 === 0 ? 0 : d }); };

  const getStyle = (l: number | undefined, n: string | undefined): string => {
    const lvl = parseInt(String(l || 0)); const nm = (n || '').toLowerCase();
    if (lvl >= 5 || nm.includes('unreal')) return 'bg-red-600/30 text-red-500 border-red-500';
    if (lvl === 4 || nm.includes('legendary')) return 'bg-yellow-500/30 text-yellow-400 border-yellow-500';
    if (lvl === 3 || nm.includes('epic')) return 'bg-fuchsia-500/30 text-fuchsia-400 border-fuchsia-500';
    if (lvl === 2 || nm.includes('rare')) return 'bg-sky-500/30 text-sky-400 border-sky-500';
    if (lvl === 1 || nm.includes('uncommon')) return 'bg-green-600/30 text-green-400 border-green-500';
    return 'bg-gray-600/30 text-gray-300 border-gray-500';
  };

  const getIng = (r: MinerData): string => {
    let h = '<div class="flex flex-wrap gap-1 max-w-md">';
    for (let i = 1; i <= 5; i++) if (r[`Miner Sursa ${i} Nume`]) h += `<span class="px-1.5 py-0.5 rounded border ${getStyle(r[`Miner Sursa ${i} Nivel`] as number, r[`Miner Sursa ${i} Nume`] as string)}">${r[`Miner Sursa ${i} Cantitate`]}x ${r[`Miner Sursa ${i} Nume`]}</span>`;
    for (let i = 1; i <= 10; i++) if (r[`Piesa ${i} Nume`]) h += `<span class="px-1.5 py-0.5 rounded border ${getStyle(r[`Piesa ${i} Nivel`] as number, r[`Piesa ${i} Nume`] as string)}">${r[`Piesa ${i} Cantitate`]}x ${r[`Piesa ${i} Nume`]}</span>`;
    return h + '</div>';
  };

  const getMkt = (v: string | number | boolean | undefined): string => {
    if (v === true || v === 'true' || v === 'True' || v === 'Da' || v === '1') return '<span class="text-green-400 font-bold">✓</span>';
    if (v === false || v === 'false' || v === 'False' || v === 'Nu' || v === '0') return '<span class="text-red-400 font-bold">✗</span>';
    return '<span class="text-gray-500">-</span>';
  };

  const getIcon = (lvl: number | undefined): React.ReactNode => {
    if (!isNaN(lvl || 0) && (lvl || 0) >= 1) return <img src={`/levels/level_${(lvl || 0) + 1}.png`} onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }} className="w-5 h-5" alt="" />;
    return <i className="fa-solid fa-server text-gray-500 text-[10px]"></i>;
  };

  // Use appliedFilters for filtering
  let filtered = [...globalData];
  filtered = filtered.filter(r => {
    if (appliedFilters.levels.length) { const lvl = parseInt(String(r['Nivel Final'] || 0)); if (!appliedFilters.levels.includes(lvl)) return false; }
    if (appliedFilters.market.length) { 
      const canSell = String(r['Poate fi vândut']).toLowerCase() === 'true' || String(r['Poate fi vândut']).toLowerCase() === 'da';
      if (!appliedFilters.market.includes(canSell)) return false; 
    }
    const p = (r['Putere Rezultat (GH/s)'] as number) || 0;
    const b = (r['Bonus Rezultat %'] as number) || 0;
    const pr = (r['Cost RLT/RST'] as number) || 0;
    const x = (r['XP Reward'] as number) || 0;
    const g = r.powerRatio || 0;
    const pe = r.bonusRatio || 0;
    const e = r.efficiency || 0;
    const xr = r.xpRatio || 0;
    if (appliedFilters.powerMin !== null && p < appliedFilters.powerMin) return false;
    if (appliedFilters.powerMax !== null && p > appliedFilters.powerMax) return false;
    if (appliedFilters.bonusMin !== null && b < appliedFilters.bonusMin) return false;
    if (appliedFilters.bonusMax !== null && b > appliedFilters.bonusMax) return false;
    if (appliedFilters.priceMin !== null && pr < appliedFilters.priceMin) return false;
    if (appliedFilters.priceMax !== null && pr > appliedFilters.priceMax) return false;
    if (appliedFilters.xpMin !== null && x < appliedFilters.xpMin) return false;
    if (appliedFilters.xpMax !== null && x > appliedFilters.xpMax) return false;
    if (appliedFilters.ghrltMin !== null && g < appliedFilters.ghrltMin) return false;
    if (appliedFilters.ghrltMax !== null && g > appliedFilters.ghrltMax) return false;
    if (appliedFilters.perrltMin !== null && pe < appliedFilters.perrltMin) return false;
    if (appliedFilters.perrltMax !== null && pe > appliedFilters.perrltMax) return false;
    if (appliedFilters.effMin !== null && e < appliedFilters.effMin) return false;
    if (appliedFilters.effMax !== null && e > appliedFilters.effMax) return false;
    if (appliedFilters.xprltMin !== null && xr < appliedFilters.xprltMin) return false;
    if (appliedFilters.xprltMax !== null && xr > appliedFilters.xprltMax) return false;
    return true;
  });

  filtered.sort((a, b) => {
    let va = a[currentSort.column], vb = b[currentSort.column];
    if (va === undefined || va === null) va = -1;
    if (vb === undefined || vb === null) vb = -1;
    if (typeof va === 'string' && typeof vb === 'string') return currentSort.asc ? va.localeCompare(vb) : vb.localeCompare(va);
    return currentSort.asc ? (va as number) - (vb as number) : (vb as number) - (va as number);
  });

  if (searchValue) filtered = filtered.filter(r => ((r['Nume Miner'] as string) || '').toLowerCase().includes(searchValue.toLowerCase()));

  useEffect(() => { setRowCount(filtered.length); }, [filtered.length]);

  const handleSort = (col: string) => {
    if (currentSort.column === col) setCurrentSort({ ...currentSort, asc: !currentSort.asc });
    else setCurrentSort({ column: col, asc: !['powerRatio', 'bonusRatio', 'efficiency', 'xpRatio', 'Putere Rezultat (GH/s)', 'Bonus Rezultat %', 'XP Reward', 'Poate fi vândut'].includes(col) });
  };

  const toggleCol = (c: string) => { const n = new Set(visibleColumns); n.has(c) ? n.delete(c) : n.add(c); setVisibleColumns(n); };
  const handleLvl = (l: number, chk: boolean) => setFilters({ ...filters, levels: chk ? [...filters.levels, l] : filters.levels.filter((x: number) => x !== l) });
  const handleMkt = (v: boolean, chk: boolean) => setFilters({ ...filters, market: chk ? [...filters.market, v] : filters.market.filter((x: boolean) => x !== v) });
  const clearFilters = () => { setFilters(defaultFilters); setAppliedFilters(defaultFilters); setSliderValues(sliderRanges); };

  const updSlid = (t: string, h: 'min' | 'max', v: number) => {
    const cur = sliderValues[t as keyof typeof sliderValues];
    let nv = v;
    if (h === 'min' && v > cur.max) nv = cur.max;
    if (h === 'max' && v < cur.min) nv = cur.min;
    const nval = h === 'min' ? { min: nv, max: cur.max } : { min: cur.min, max: nv };
    setSliderValues({ ...sliderValues, [t]: nval });
    const fkMin = `${t}Min` as keyof FilterState;
    const fkMax = `${t}Max` as keyof FilterState;
    setFilters({ ...filters, [fkMin]: h === 'min' ? nv : cur.min, [fkMax]: h === 'max' ? nv : cur.max });
  };

  useEffect(() => { if (columnDropdownOpen) { const cl = () => setColumnDropdownOpen(false); document.addEventListener('click', cl); return () => document.removeEventListener('click', cl); } }, [columnDropdownOpen]);

  const renderSlider = (type: string, label: string) => {
    const rng = sliderRanges[type as keyof typeof sliderRanges];
    const val = sliderValues[type as keyof typeof sliderValues];
    const fMin = filters[`${type}Min` as keyof FilterState] as number | null;
    const fMax = filters[`${type}Max` as keyof FilterState] as number | null;
    return (
      <div className="border-t pt-3" style={{ borderColor: '#414868' }}>
        <label className="text-gray-400 block mb-1">{label}:</label>
        <div className="flex items-center gap-1 mb-2 w-full">
          <input type="number" placeholder="Min" className="w-full bg-gray-800 border rounded px-1 py-1 text-xs text-white" style={{ borderColor: '#414868' }} value={fMin ?? ''} onChange={e => setFilters({...filters, [`${type}Min` as keyof FilterState]: e.target.value ? parseFloat(e.target.value) : null})} />
          <span className="text-gray-500">-</span>
          <input type="number" placeholder="Max" className="w-full bg-gray-800 border rounded px-1 py-1 text-xs text-white" style={{ borderColor: '#414868' }} value={fMax ?? ''} onChange={e => setFilters({...filters, [`${type}Max` as keyof FilterState]: e.target.value ? parseFloat(e.target.value) : null})} />
        </div>
        <div className="dual-slider">
          <div className="dual-slider-track"></div>
          <div className="dual-slider-range" style={{ left: `${(val.min / rng.max) * 100}%`, width: `${((val.max - val.min) / rng.max) * 100}%` }}></div>
          <input type="range" min={rng.min} max={rng.max} value={val.min} step={(rng.max - rng.min) / 100} onChange={e => updSlid(type, 'min', parseFloat(e.target.value))} />
          <input type="range" min={rng.min} max={rng.max} value={val.max} step={(rng.max - rng.min) / 100} onChange={e => updSlid(type, 'max', parseFloat(e.target.value))} />
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1a1b26' }}>
      <div className="text-center">
        <div style={{ width: 50, height: 50, border: '4px solid #414868', borderTop: '4px solid #7aa2f7', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
        <p className="text-white text-lg">Loading data...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#1a1b26', color: '#a9b1d6' }}>
      <style>{`
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #1a1b26; }
        ::-webkit-scrollbar-thumb { background: #414868; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #7aa2f7; }
        .dual-slider { position: relative; height: 24px; margin: 8px 0; }
        .dual-slider-track { position: absolute; top: 50%; transform: translateY(-50%); height: 6px; background: #414868; border-radius: 3px; width: 100%; z-index: 0; }
        .dual-slider-range { position: absolute; top: 50%; transform: translateY(-50%); height: 6px; background: #7aa2f7; border-radius: 3px; z-index: 1; }
        .dual-slider input[type="range"] { position: absolute; width: 100%; pointer-events: none; background: none; -webkit-appearance: none; top: 50%; transform: translateY(-50%); z-index: 2; }
        .dual-slider input[type="range"]::-webkit-slider-thumb { pointer-events: all; height: 18px; width: 18px; -webkit-appearance: none; background: #7aa2f7; border-radius: 50%; cursor: pointer; border: 3px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.3); }
        th.sortable { cursor: pointer; user-select: none; transition: background-color 0.2s; }
        th.sortable:hover { background-color: rgba(255, 255, 255, 0.05); }
        .upload-zone { border: 2px dashed #414868; transition: all 0.3s ease; }
        .upload-zone.dragover { border-color: #7aa2f7; background-color: rgba(122, 162, 247, 0.1); }
      `}</style>

      {/* Header */}
      <div className="w-full max-w-[95%] mb-8 mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl border shadow-lg" style={{ backgroundColor: '#24283b', borderColor: '#414868' }}>
            <i className="fa-solid fa-hammer text-2xl" style={{ color: '#7aa2f7' }}></i>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Merge Calculator <span style={{ color: '#bb9af7' }}>Pro</span></h1>
            <p className="text-sm text-gray-400">Analyze profitability and efficiency of RollerCoin resources.</p>
          </div>
        </div>
        
        <Link to={`/${lang}`} className="px-4 py-2 rounded-lg font-medium transition-colors" style={{ backgroundColor: '#24283b', border: '1px solid #414868', color: '#a9b1d6' }}>
          <i className="fa-solid fa-arrow-left mr-2"></i>{lang === 'tr' ? 'Ana Sayfaya Dön' : 'Back to Main'}
        </Link>
      </div>

      {/* Upload */}
      {showUpload && (
        <div className="w-full max-w-7xl mb-8 mx-auto">
          <div className="rounded-2xl shadow-xl border overflow-hidden" style={{ backgroundColor: '#24283b', borderColor: '#414868' }}>
            <div className="p-8">
              <div ref={dropzoneRef} className="upload-zone rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer" 
                onDrop={e => { e.preventDefault(); dropzoneRef.current?.classList.remove('dragover'); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }} 
                onDragOver={e => { e.preventDefault(); dropzoneRef.current?.classList.add('dragover'); }} 
                onDragLeave={() => dropzoneRef.current?.classList.remove('dragover')} 
                onClick={() => fileInputRef.current?.click()}>
                <i className="fa-solid fa-cloud-arrow-up text-5xl text-gray-500 mb-4"></i>
                <h3 className="text-xl font-semibold text-white mb-2">Upload CSV File</h3>
                <p className="text-gray-400 mb-6 text-sm">Drag <i>calcul_merge_rollercoin_GH.csv</i> here or click to browse.</p>
                <input type="file" ref={fileInputRef} accept=".csv" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                <button className="px-6 py-2 rounded-lg font-medium transition-colors shadow-lg" style={{ backgroundColor: '#7aa2f7', color: 'white' }} onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>Select File</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auto-load msg */}
      {showAutoLoadMsg && (
        <div className="w-full max-w-7xl mb-4 mx-auto">
          <div className="rounded-lg p-3 flex items-center gap-2 text-sm" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.5)', color: '#34d399' }}>
            <i className="fa-solid fa-check-circle"></i>
            <span>CSV file loaded automatically</span>
          </div>
        </div>
      )}

      {/* Filters */}
      {globalData.length > 0 && (
        <div className="w-full max-w-[98%] mb-4 mx-auto">
          <div className="rounded-xl border p-4" style={{ backgroundColor: '#24283b', borderColor: '#414868' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white"><i className="fa-solid fa-filter mr-2"></i>Filters</h3>
              <button onClick={clearFilters} className="text-xs hover:text-red-300" style={{ color: '#f87171' }}><i className="fa-solid fa-xmark mr-1"></i>Resetează</button>
            </div>
            
            {/* Row 1 */}
            <div className="grid grid-cols-5 gap-2">
              <div className="border-t pt-3" style={{ borderColor: '#414868' }}>
                <label className="text-gray-400 block mb-2 font-medium"> Level:</label>
                <div className="flex gap-2 flex-wrap">
                  {[1,2,3,4,5].map(l => (
                    <label key={l} className="flex flex-col items-center gap-1 cursor-pointer text-sm">
                      <input type="checkbox" checked={filters.levels.includes(l)} onChange={e => handleLvl(l, e.target.checked)} className="w-6 h-6" style={{ accentColor: '#7aa2f7' }} />
                      <img src={`/levels/level_${l+1}.png`} className="w-6 h-6" alt="" />
                    </label>
                  ))}
                </div>
              </div>
              <div className="border-t pt-3" style={{ borderColor: '#414868' }}>
                <label className="text-gray-400 block mb-2 font-medium">Can be sold:</label>
                <div className="flex gap-3 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={filters.market.includes(true)} onChange={e => handleMkt(true, e.target.checked)} className="w-6 h-6" style={{ accentColor: '#7aa2f7' }} />
                    <span>✓ Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={filters.market.includes(false)} onChange={e => handleMkt(false, e.target.checked)} className="w-6 h-6" style={{ accentColor: '#7aa2f7' }} />
                    <span>✗ No</span>
                  </label>
                </div>
              </div>
              {renderSlider('power', 'Power (GH/s)')}
              {renderSlider('bonus', 'Bonus %')}
              {renderSlider('price', 'Price (RLT)')}
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-5 gap-2 mt-2">
              {renderSlider('xp', t.xp)}
              {renderSlider('ghrlt', t.ghrlt)}
              {renderSlider('perrlt', t.perrlt)}
              {renderSlider('eff', t.efficiency)}
              {renderSlider('xprlt', t.xprlt)}
            </div>

            {/* Apply Button */}
            <div className="mt-4 flex justify-center">
              <button onClick={applyAllFilters} className="px-8 py-2 rounded-lg font-medium transition-colors" style={{ backgroundColor: '#7aa2f7', color: 'white' }}>
                <i className="fa-solid fa-filter mr-2"></i> {t.applyFilters}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {globalData.length > 0 && (
        <div className="w-full max-w-[98%] mx-auto flex flex-col gap-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-gray-400"><span className="font-bold text-white">{rowCount}</span> {t.minersFound}</p>
            
            <div className="flex gap-4 text-xs items-center">
              {/* Search Bar - on same row as Columns */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fa-solid fa-search text-gray-400"></i>
                </div>
                <input type="text" placeholder={t.searchPlaceholder} value={searchValue} onChange={e => setSearchValue(e.target.value)}
                  className="block w-full pl-10 pr-3 py-1.5 border rounded-lg text-white placeholder-gray-400 focus:outline-none text-xs"
                  style={{ backgroundColor: '#24283b', borderColor: '#414868', width: '180px' }} />
              </div>
              
              <span className="text-gray-500">Note: High points = Power + Higher Bonus</span>
              <div className="relative">
                <button id="colToggleBtn" className="px-3 py-1.5 rounded-lg border transition-colors" style={{ backgroundColor: '#24283b', borderColor: '#414868', color: '#a9b1d6' }} onClick={e => { e.stopPropagation(); setColumnDropdownOpen(!columnDropdownOpen); }}>
                  <i className="fa-solid fa-eye mr-1"></i> {t.columns}
                </button>
                {columnDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-48 rounded-lg shadow-xl z-50" style={{ backgroundColor: '#24283b', border: '1px solid #414868' }}>
                    <div className="p-2 text-xs text-gray-400 border-b" style={{ borderColor: '#414868' }}>{t.showHideColumns}</div>
                    {['col-power', 'col-bonus', 'col-price', 'col-ghrlt', 'col-perrlt', 'col-efficiency', 'col-xprlt', 'col-xp', 'col-market', 'col-ingredients'].map(c => (
                      <label key={c} className="flex items-center gap-2 p-2 hover:bg-gray-700/30 cursor-pointer">
                        <input type="checkbox" checked={visibleColumns.has(c)} onChange={() => toggleCol(c)} style={{ accentColor: '#7aa2f7' }} />
                        <span>{c.replace('col-', '').replace('-', ' ')}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={resetData} className="hover:text-red-300 transition-colors ml-4" style={{ color: '#f87171' }}><i className="fa-solid fa-trash-can mr-1"></i> {t.loadAnotherFile}</button>
            </div>
          </div>
          
          <div className="rounded-2xl shadow-xl border overflow-hidden overflow-x-auto" style={{ backgroundColor: '#24283b', borderColor: '#414868' }}>
            <table className="w-full text-left border-collapse whitespace-nowrap table-auto">
              <thead>
                <tr className="bg-gray-800/50 border-b text-[10px] uppercase tracking-wider text-gray-300" style={{ borderColor: '#414868' }}>
                  <th className="p-3 text-center sortable col-market" onClick={() => handleSort('Poate fi vândut')}><i className="fa-solid fa-shop"></i></th>
                  <th className="p-3 sortable" onClick={() => handleSort('Nume Miner')}>Miner <i className="fa-solid fa-sort ml-1 opacity-50"></i></th>
                  <th className={`p-3 text-right sortable ${visibleColumns.has('col-power') ? '' : 'hidden'}`} onClick={() => handleSort('Putere Rezultat (GH/s)')}>Power (GH/s) <i className="fa-solid fa-sort ml-1 opacity-50"></i></th>
                  <th className={`p-3 text-right sortable ${visibleColumns.has('col-bonus') ? '' : 'hidden'}`} onClick={() => handleSort('Bonus Rezultat %')}>Bonus % <i className="fa-solid fa-sort ml-1 opacity-50"></i></th>
                  <th className={`p-3 text-center sortable ${visibleColumns.has('col-price') ? '' : 'hidden'}`} onClick={() => handleSort('Cost RLT/RST')}>Price <i className="fa-solid fa-sort ml-1 opacity-50"></i></th>
                  <th className={`p-3 text-right sortable bg-blue-900/20 text-blue-200 border-x ${visibleColumns.has('col-ghrlt') ? '' : 'hidden'}`} style={{ borderColor: 'rgba(65, 72, 104, 0.2)' }} onClick={() => handleSort('powerRatio')}>GH/RLT <i className="fa-solid fa-sort ml-1 opacity-50"></i></th>
                  <th className={`p-3 text-right sortable bg-blue-900/20 text-blue-200 border-r ${visibleColumns.has('col-perrlt') ? '' : 'hidden'}`} style={{ borderColor: 'rgba(65, 72, 104, 0.2)' }} onClick={() => handleSort('bonusRatio')}>%/RLT <i className="fa-solid fa-sort ml-1 opacity-50"></i></th>
                  <th className={`p-3 text-right sortable bg-indigo-900/30 font-bold ${visibleColumns.has('col-efficiency') ? '' : 'hidden'}`} style={{ color: '#bb9af7', borderColor: 'rgba(65, 72, 104, 0.2)' }} onClick={() => handleSort('efficiency')}>Efficiency <i className="fa-solid fa-sort ml-1 opacity-50"></i></th>
                  <th className={`p-3 text-right sortable bg-purple-900/30 text-purple-200 border-l ${visibleColumns.has('col-xprlt') ? '' : 'hidden'}`} style={{ borderColor: 'rgba(65, 72, 104, 0.2)' }} onClick={() => handleSort('xpRatio')}>XP/RLT <i className="fa-solid fa-sort ml-1 opacity-50"></i></th>
                  <th className={`p-3 text-center sortable ${visibleColumns.has('col-xp') ? '' : 'hidden'}`} onClick={() => handleSort('XP Reward')}>XP <i className="fa-solid fa-sort ml-1 opacity-50"></i></th>
                  <th className={`p-3 ${visibleColumns.has('col-ingredients') ? '' : 'hidden'}`}>Ingredients</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs" style={{ borderColor: '#414868' }}>
                {filtered.length === 0 ? (
                  <tr><td colSpan={11} className="p-8 text-center text-gray-400">No results found.</td></tr>
                ) : filtered.map((row, idx) => { 
                  const apiLvl = parseInt(String(row['Nivel Final'] || 0)); 
                  return (
                    <tr key={idx} className="hover:bg-gray-800/30 transition-colors border-b" style={{ borderColor: 'rgba(65, 72, 104, 0.3)' }}>
                      <td className={`p-3 text-center col-market ${visibleColumns.has('col-market') ? '' : 'hidden'}`} dangerouslySetInnerHTML={{ __html: getMkt(row['Poate fi vândut']) }}></td>
                      <td className="p-3"><div className="flex items-center gap-2">{getIcon(apiLvl)}<span className="font-semibold text-white truncate max-w-[150px]" title={String(row['Nume Miner'])}>{String(row['Nume Miner'] || 'N/A')}</span></div></td>
                      <td className={`p-3 text-right font-mono font-medium ${visibleColumns.has('col-power') ? '' : 'hidden'}`} style={{ color: '#7aa2f7' }}>{fmt(row['Putere Rezultat (GH/s)'] as number, 0)}</td>
                      <td className={`p-3 text-right font-mono ${visibleColumns.has('col-bonus') ? '' : 'hidden'}`} style={{ color: '#4ade80' }}>{fmt(row['Bonus Rezultat %'] as number, 2)}%</td>
                      <td className={`p-3 text-center font-mono font-bold ${visibleColumns.has('col-price') ? '' : 'hidden'}`} style={{ color: '#facc15' }}>{(row['Cost RLT/RST'] as number) > 0 ? fmt(row['Cost RLT/RST'] as number, 2) + ' R' : '-'}</td>
                      <td className={`p-3 text-right font-mono bg-blue-900/5 border-x ${visibleColumns.has('col-ghrlt') ? '' : 'hidden'}`} style={{ color: '#93c5fd', borderColor: 'rgba(65, 72, 104, 0.1)' }}>{fmt(row.powerRatio, 0)}</td>
                      <td className={`p-3 text-right font-mono bg-blue-900/5 border-r ${visibleColumns.has('col-perrlt') ? '' : 'hidden'}`} style={{ color: '#93c5fd', borderColor: 'rgba(65, 72, 104, 0.1)' }}>{fmt(row.bonusRatio, 3)}</td>
                      <td className={`p-3 text-right font-mono bg-indigo-900/10 font-bold ${visibleColumns.has('col-efficiency') ? '' : 'hidden'}`} style={{ color: '#bb9af7' }}>{fmt(row.efficiency, 1)}</td>
                      <td className={`p-3 text-right font-mono bg-purple-900/10 border-l ${visibleColumns.has('col-xprlt') ? '' : 'hidden'}`} style={{ color: '#c084fc', borderColor: 'rgba(65, 72, 104, 0.2)' }}>{fmt(row.xpRatio, 2)}</td>
                      <td className={`p-3 text-center font-bold ${visibleColumns.has('col-xp') ? '' : 'hidden'}`} style={{ color: '#9ca3af' }}>{fmt(row['XP Reward'] as number, 0)}</td>
                      <td className={`p-3 col-ingredients ${visibleColumns.has('col-ingredients') ? '' : 'hidden'}`} dangerouslySetInnerHTML={{ __html: getIng(row) }}></td>
                    </tr>
                  ); 
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MergeCalculator;
