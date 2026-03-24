import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './MergeCalculator.css';

interface MinerData {
  [key: string]: string | number | undefined;
}

interface SortConfig {
  column: string;
  asc: boolean;
}

interface ActiveFilters {
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

const MergeCalculator: React.FC = () => {
  const { t } = useTranslation();
  const [globalData, setGlobalData] = useState<MinerData[]>([]);
  const [filteredData, setFilteredData] = useState<MinerData[]>([]);
  const [currentSort, setCurrentSort] = useState<SortConfig>({ column: 'efficiency', asc: false });
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [autoLoadMsg, setAutoLoadMsg] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [filters, setFilters] = useState<ActiveFilters>({
    levels: [],
    market: [],
    powerMin: null,
    powerMax: null,
    bonusMin: null,
    bonusMax: null,
    priceMin: null,
    priceMax: null,
    xpMin: null,
    xpMax: null,
    ghrltMin: null,
    ghrltMax: null,
    perrltMin: null,
    perrltMax: null,
    effMin: null,
    effMax: null,
    xprltMin: null,
    xprltMax: null,
  });

  const [sliderRanges, setSliderRanges] = useState({
    power: [0, 100],
    bonus: [0, 100],
    price: [0, 100],
    xp: [0, 100],
    ghrlt: [0, 100],
    perrlt: [0, 100],
    eff: [0, 100],
    xprlt: [0, 100],
  });

  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set([
    'col-power', 'col-bonus', 'col-price', 'col-ghrlt', 'col-perrlt',
    'col-efficiency', 'col-xprlt', 'col-xp', 'col-market', 'col-ingredients'
  ]));

  const [showColDropdown, setShowColDropdown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  const parseCSVData = (csvText: string) => {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return;
    
    const headers = lines[0].split(',').map(h => h.trim());
    const data: MinerData[] = [];

    for (let i = 1; i < lines.length; i++) {
      const rowStr = lines[i];
      const row: string[] = [];
      let inQuotes = false;
      let val = '';
      
      for (let char of rowStr) {
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) { row.push(val.trim()); val = ''; }
        else val += char;
      }
      row.push(val.trim());

      const obj: MinerData = {};
      headers.forEach((header, index) => {
        const value = row[index] || '';
        if (value !== '' && !isNaN(Number(value))) obj[header] = Number(value);
        else obj[header] = value;
      });

      const power = Number(obj['Putere Rezultat (GH/s)']) || 0;
      const bonus = Number(obj['Bonus Rezultat %']) || 0;
      const price = Number(obj['Cost RLT/RST']) || 0;
      const xp = Number(obj['XP Reward']) || 0;

      obj.powerRatio = price > 0 ? (power / price) : 0;
      obj.bonusRatio = price > 0 ? (bonus / price) : 0;
      obj.efficiency = (power / 1000000) + (bonus * 5.28);
      obj.xpRatio = price > 0 ? (xp / price) : 0;

      data.push(obj);
    }

    const sortedData = data.sort((a, b) => (Number(b.efficiency) || 0) - (Number(a.efficiency) || 0));
    
    setGlobalData(sortedData);
    setFilteredData(sortedData);
    setLoading(false);
    setShowUpload(false);
    setAutoLoadMsg(true);
    calculateSliderRanges(sortedData);
  };

  const calculateSliderRanges = (data: MinerData[]) => {
    let powerMax = 0, bonusMax = 0, priceMax = 0, xpMax = 0;
    let ghrltMax = 0, perrltMax = 0, effMax = 0, xprltMax = 0;

    data.forEach((row: MinerData) => {
      const power = Number(row['Putere Rezultat (GH/s)']) || 0;
      const bonus = Number(row['Bonus Rezultat %']) || 0;
      const price = Number(row['Cost RLT/RST']) || 0;
      const xp = Number(row['XP Reward']) || 0;
      const ghrlt = Number(row.powerRatio) || 0;
      const perrlt = Number(row.bonusRatio) || 0;
      const eff = Number(row.efficiency) || 0;
      const xprlt = Number(row.xpRatio) || 0;

      if (power > powerMax) powerMax = power;
      if (bonus > bonusMax) bonusMax = bonus;
      if (price > priceMax) priceMax = price;
      if (xp > xpMax) xpMax = xp;
      if (ghrlt > ghrltMax) ghrltMax = ghrlt;
      if (perrlt > perrltMax) perrltMax = perrlt;
      if (eff > effMax) effMax = eff;
      if (xprlt > xprltMax) xprltMax = xprlt;
    });

    powerMax = Math.ceil(powerMax / 10000000) * 10000000 || 100;
    bonusMax = Math.ceil(bonusMax / 10) * 10 || 100;
    priceMax = Math.ceil(priceMax / 10000) * 10000 || 100;
    xpMax = Math.ceil(xpMax / 100000) * 100000 || 100;
    ghrltMax = Math.ceil(ghrltMax / 1000) * 1000 || 100;
    perrltMax = Math.ceil(perrltMax / 0.1) * 0.1 || 100;
    effMax = Math.ceil(effMax / 100) * 100 || 100;
    xprltMax = Math.ceil(xprltMax / 100) * 100 || 100;

    setSliderRanges({
      power: [0, powerMax],
      bonus: [0, bonusMax],
      price: [0, priceMax],
      xp: [0, xpMax],
      ghrlt: [0, ghrltMax],
      perrlt: [0, perrltMax],
      eff: [0, effMax],
      xprlt: [0, xprltMax],
    });

    setFilters(prev => ({
      ...prev,
      powerMax,
      bonusMax,
      priceMax,
      xpMax,
      ghrltMax,
      perrltMax,
      effMax,
      xprltMax,
    }));
  };

  useEffect(() => {
    fetch('/calcul_merge_rollercoin_GH.csv')
      .then(response => {
        if (response.ok) return response.text();
        throw new Error('File not found');
      })
      .then(csvText => {
        parseCSVData(csvText);
      })
      .catch(() => {
        setLoading(false);
        setShowUpload(true);
      });
  }, []);

  useEffect(() => {
    applyAllFilters();
  }, [filters, searchTerm, globalData]);

  const applyAllFilters = () => {
    let result = globalData;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((row: MinerData) => {
        const name = String(row['Nume Miner'] || '').toLowerCase();
        return name.includes(term);
      });
    }

    if (filters.levels.length > 0) {
      result = result.filter((row: MinerData) => {
        const level = parseInt(String(row['Nivel Final']));
        return filters.levels.includes(level);
      });
    }

    if (filters.market.length > 0) {
      result = result.filter((row: MinerData) => {
        const val = String(row['Poate fi vândut']);
        const canSell = val === 'true' || val === 'True' || val === 'Da' || val === '1';
        return filters.market.includes(canSell);
      });
    }

    result = result.filter((row: MinerData) => {
      const power = Number(row['Putere Rezultat (GH/s)']) || 0;
      const bonus = Number(row['Bonus Rezultat %']) || 0;
      const price = Number(row['Cost RLT/RST']) || 0;
      const xp = Number(row['XP Reward']) || 0;
      const ghrlt = Number(row.powerRatio) || 0;
      const perrlt = Number(row.bonusRatio) || 0;
      const eff = Number(row.efficiency) || 0;
      const xprlt = Number(row.xpRatio) || 0;

      if (filters.powerMin !== null && power < filters.powerMin) return false;
      if (filters.powerMax !== null && power > filters.powerMax) return false;
      if (filters.bonusMin !== null && bonus < filters.bonusMin) return false;
      if (filters.bonusMax !== null && bonus > filters.bonusMax) return false;
      if (filters.priceMin !== null && price < filters.priceMin) return false;
      if (filters.priceMax !== null && price > filters.priceMax) return false;
      if (filters.xpMin !== null && xp < filters.xpMin) return false;
      if (filters.xpMax !== null && xp > filters.xpMax) return false;
      if (filters.ghrltMin !== null && ghrlt < filters.ghrltMin) return false;
      if (filters.ghrltMax !== null && ghrlt > filters.ghrltMax) return false;
      if (filters.perrltMin !== null && perrlt < filters.perrltMin) return false;
      if (filters.perrltMax !== null && perrlt > filters.perrltMax) return false;
      if (filters.effMin !== null && eff < filters.effMin) return false;
      if (filters.effMax !== null && eff > filters.effMax) return false;
      if (filters.xprltMin !== null && xprlt < filters.xprltMin) return false;
      if (filters.xprltMax !== null && xprlt > filters.xprltMax) return false;

      return true;
    });

    result = sortData(result);
    setFilteredData(result);
  };

  const sortData = (data: MinerData[]): MinerData[] => {
    const { column, asc } = currentSort;
    return [...data].sort((a: MinerData, b: MinerData) => {
      let aVal = a[column];
      let bVal = b[column];

      if (column === 'Nume Miner') {
        aVal = String(aVal || '').toLowerCase();
        bVal = String(bVal || '').toLowerCase();
      } else {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      }

      if (aVal < bVal) return asc ? -1 : 1;
      if (aVal > bVal) return asc ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (column: string) => {
    const isMetric = ['powerRatio', 'bonusRatio', 'efficiency', 'xpRatio', 
                     'Putere Rezultat (GH/s)', 'Bonus Rezultat %', 'XP Reward', 
                     'Poate fi vândut', 'Cost RLT/RST'].includes(column);
    
    if (currentSort.column === column) {
      setCurrentSort({ column, asc: !currentSort.asc });
    } else {
      setCurrentSort({ column, asc: !isMetric });
    }
  };

  const clearFilters = () => {
    setFilters({
      levels: [],
      market: [],
      powerMin: null,
      powerMax: null,
      bonusMin: null,
      bonusMax: null,
      priceMin: null,
      priceMax: null,
      xpMin: null,
      xpMax: null,
      ghrltMin: null,
      ghrltMax: null,
      perrltMin: null,
      perrltMax: null,
      effMin: null,
      effMax: null,
      xprltMin: null,
      xprltMax: null,
    });
    setSearchTerm('');
  };

  const resetData = () => {
    setGlobalData([]);
    setFilteredData([]);
    setShowUpload(true);
    setAutoLoadMsg(false);
    setSearchTerm('');
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      alert('Please upload a valid CSV file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        parseCSVData(e.target.result as string);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dropzoneRef.current?.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      handleFile(e.target.files[0]);
    }
  };

  const toggleColumn = (col: string) => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      if (next.has(col)) next.delete(col);
      else next.add(col);
      return next;
    });
  };

  const updateFilter = (key: keyof ActiveFilters, value: number | null) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const formatNumber = (num: number | undefined, decimals = 2): string => {
    if (num === undefined || num === null || isNaN(num)) return '0';
    return num.toLocaleString('en-US', { 
      maximumFractionDigits: decimals, 
      minimumFractionDigits: (num % 1 === 0 ? 0 : decimals) 
    });
  };

  const getRarityStyleByLevel = (lvlNum: string | number, itemName: string): string => {
    const lvl = parseInt(String(lvlNum));
    const name = (itemName || '').toLowerCase();
    if (lvl >= 5 || name.includes('unreal')) return 'bg-red-600/30 text-red-500 border-red-500';
    if (lvl === 4 || name.includes('legendary')) return 'bg-yellow-500/30 text-yellow-400 border-yellow-500';
    if (lvl === 3 || name.includes('epic')) return 'bg-fuchsia-500/30 text-fuchsia-400 border-fuchsia-500';
    if (lvl === 2 || name.includes('rare')) return 'bg-sky-500/30 text-sky-400 border-sky-500';
    if (lvl === 1 || name.includes('uncommon')) return 'bg-green-600/30 text-green-400 border-green-500';
    return 'bg-gray-600/30 text-gray-300 border-gray-500';
  };

  const getIngredientsHtml = (row: MinerData): string => {
    let html = '<div class="flex flex-wrap gap-1 max-w-md">';
    for(let i=1; i<=5; i++) {
      const name = row[`Miner Sursa ${i} Nume`];
      if(name) {
        const style = getRarityStyleByLevel(row[`Miner Sursa ${i} Nivel`] || 0, String(name));
        html += `<span class="px-1.5 py-0.5 rounded border ${style}">${row[`Miner Sursa ${i} Cantitate`]}x ${name}</span>`;
      }
    }
    for(let i=1; i<=10; i++) {
      const name = row[`Piesa ${i} Nume`];
      if(name) {
        const style = getRarityStyleByLevel(row[`Piesa ${i} Nivel`] || 0, String(name));
        html += `<span class="px-1.5 py-0.5 rounded border ${style}">${row[`Piesa ${i} Cantitate`]}x ${name}</span>`;
      }
    }
    html += '</div>';
    return html;
  };

  const getMarketHtml = (canBeSold: string | boolean | undefined): string => {
    if (canBeSold === true || String(canBeSold) === 'true' || String(canBeSold) === 'True' || String(canBeSold) === 'Da' || String(canBeSold) === '1') {
      return '<span class="text-green-400 font-bold" title="Can be sold">✓</span>';
    } else if (canBeSold === false || String(canBeSold) === 'false' || String(canBeSold) === 'False' || String(canBeSold) === 'Nu' || String(canBeSold) === '0') {
      return '<span class="text-red-400 font-bold" title="Cannot be sold">✗</span>';
    }
    return '<span class="text-gray-500">-</span>';
  };

  const getLevelIcon = (nivelFinal: string | number | undefined): React.ReactNode => {
    const apiLvl = parseInt(String(nivelFinal));
    if (!isNaN(apiLvl) && apiLvl >= 1) {
      return <img src={`/levels/level_${apiLvl + 1}.png`} onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }} className="w-5 h-5 object-contain" alt={`Level ${apiLvl + 1}`} title={`Level ${apiLvl + 1}`} />;
    }
    return <i className="fa-solid fa-server text-gray-500 text-[10px]"></i>;
  };

  const getDualSliderStyle = (type: 'power' | 'bonus' | 'price' | 'xp' | 'ghrlt' | 'perrlt' | 'eff' | 'xprlt'): React.CSSProperties => {
    const [min, max] = sliderRanges[type];
    const minKey = `${type}Min` as keyof ActiveFilters;
    const maxKey = `${type}Max` as keyof ActiveFilters;
    const minVal = filters[minKey] as number | null ?? min;
    const maxVal = filters[maxKey] as number | null ?? max;
    
    const percent1 = ((minVal - min) / (max - min)) * 100;
    const percent2 = ((maxVal - min) / (max - min)) * 100;
    
    return {
      left: percent1 + '%',
      width: (percent2 - percent1) + '%'
    };
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8 font-sans"
        style={{ backgroundColor: '#1a1b26', color: '#a9b1d6' }}
      >
        <div id="loadingScreen" style={{ backgroundColor: '#1a1b26' }}>
          <div className="loader mb-4"></div>
          <p className="text-white text-lg">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8 font-sans merge-calculator-wrapper"
      style={{ backgroundColor: '#1a1b26', color: '#a9b1d6' }}
    >
      {/* Header */}
      <div className="w-full max-w-[95%] mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-rcCard p-3 rounded-xl border border-rcBorder shadow-lg">
            <i className="fa-solid fa-hammer text-2xl text-rcHighlight"></i>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Merge Calculator <span className="text-rcAccent">Pro</span></h1>
            <p className="text-sm text-gray-400">Analyze profitability and efficiency of RollerCoin resources.</p>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className={`relative w-full md:w-72 ${globalData.length === 0 ? 'hidden' : ''}`}>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i className="fa-solid fa-search text-gray-400"></i>
          </div>
          <input 
            type="text" 
            placeholder="Search a miner..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-rcBorder rounded-lg bg-rcCard text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rcHighlight focus:border-transparent transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Upload Section */}
      {showUpload && (
        <div className="w-full max-w-7xl mb-8">
          <div className="bg-rcCard rounded-2xl shadow-xl border border-rcBorder overflow-hidden">
            <div className="p-8">
              <div 
                ref={dropzoneRef}
                className="upload-zone rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer"
                onDragOver={(e) => { e.preventDefault(); dropzoneRef.current?.classList.add('dragover'); }}
                onDragLeave={() => dropzoneRef.current?.classList.remove('dragover')}
                onDrop={handleDrop}
              >
                <i className="fa-solid fa-cloud-arrow-up text-5xl text-gray-500 mb-4"></i>
                <h3 className="text-xl font-semibold text-white mb-2">Upload CSV File</h3>
                <p className="text-gray-400 mb-6 text-sm">Drag <i>calcul_merge_rollercoin_GH.csv</i> here or click to browse.</p>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept=".csv" 
                  className="hidden" 
                  onChange={handleFileInput}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="bg-rcHighlight hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/30"
                >
                  Select File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Auto-load indicator */}
      {autoLoadMsg && (
        <div className="w-full max-w-7xl mb-4">
          <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-3 flex items-center gap-2 text-green-400 text-sm">
            <i className="fa-solid fa-check-circle"></i>
            <span>CSV file loaded automatically</span>
          </div>
        </div>
      )}

      {/* Filters Section */}
      {globalData.length > 0 && (
        <div className="w-full max-w-[98%] mb-4">
          <div className="bg-rcCard rounded-xl border border-rcBorder p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white"><i className="fa-solid fa-filter mr-2"></i>Filters</h3>
              <button onClick={clearFilters} className="text-xs text-red-400 hover:text-red-300">
                <i className="fa-solid fa-xmark mr-1"></i>Resetează
              </button>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {/* Level */}
              <div className="border-t border-rcBorder pt-3">
                <label className="text-gray-400 block mb-2 font-medium">Level:</label>
                <div className="flex gap-2 flex-wrap">
                  {[1,2,3,4,5].map(level => (
                    <label key={level} className="flex flex-col items-center gap-1 cursor-pointer text-sm" title={`Level ${level}`}>
                      <input 
                        type="checkbox" 
                        checked={filters.levels.includes(level)}
                        onChange={(e) => {
                          setFilters(prev => ({
                            ...prev,
                            levels: e.target.checked 
                              ? [...prev.levels, level]
                              : prev.levels.filter((l: number) => l !== level)
                          }));
                        }}
                        className="w-6 h-6 accent-rcHighlight"
                      />
                      <img src={`/levels/level_${level + 1}.png`} className="w-6 h-6" alt={`Level ${level}`} />
                    </label>
                  ))}
                </div>
              </div>

              {/* Can be sold */}
              <div className="border-t border-rcBorder pt-3">
                <label className="text-gray-400 block mb-2 font-medium">Can be sold:</label>
                <div className="flex gap-3 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input 
                      type="checkbox" 
                      checked={filters.market.includes(true)}
                      onChange={(e) => {
                        setFilters(prev => ({
                          ...prev,
                          market: e.target.checked 
                            ? [...prev.market.filter((m: boolean) => m !== true), true]
                            : prev.market.filter((m: boolean) => m !== true)
                        }));
                      }}
                      className="w-6 h-6 accent-rcHighlight"
                    />
                    <span>✓ Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input 
                      type="checkbox" 
                      checked={filters.market.includes(false)}
                      onChange={(e) => {
                        setFilters(prev => ({
                          ...prev,
                          market: e.target.checked 
                            ? [...prev.market.filter((m: boolean) => m !== false), false]
                            : prev.market.filter((m: boolean) => m !== false)
                        }));
                      }}
                      className="w-6 h-6 accent-rcHighlight"
                    />
                    <span>✗ No</span>
                  </label>
                </div>
              </div>

              {/* Power */}
              <div className="border-t border-rcBorder pt-3">
                <label className="text-gray-400 block mb-1">Power (GH/s):</label>
                <div className="flex items-center gap-1 mb-2 w-full">
                  <input 
                    type="number" 
                    placeholder="Min" 
                    value={filters.powerMin ?? ''}
                    onChange={(e) => updateFilter('powerMin', e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-gray-800 border border-rcBorder rounded px-1 py-1 text-xs text-white"
                  />
                  <span className="text-gray-500">-</span>
                  <input 
                    type="number" 
                    placeholder="Max" 
                    value={filters.powerMax ?? ''}
                    onChange={(e) => updateFilter('powerMax', e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-gray-800 border border-rcBorder rounded px-1 py-1 text-xs text-white"
                  />
                </div>
                <div className="dual-slider">
                  <div className="dual-slider-track"></div>
                  <div className="dual-slider-range" style={getDualSliderStyle('power')}></div>
                  <input 
                    type="range" 
                    min={sliderRanges.power[0]} 
                    max={sliderRanges.power[1]} 
                    value={filters.powerMin ?? sliderRanges.power[0]}
                    onChange={(e) => updateFilter('powerMin', Number(e.target.value))}
                  />
                  <input 
                    type="range" 
                    min={sliderRanges.power[0]} 
                    max={sliderRanges.power[1]} 
                    value={filters.powerMax ?? sliderRanges.power[1]}
                    onChange={(e) => updateFilter('powerMax', Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Bonus */}
              <div className="border-t border-rcBorder pt-3">
                <label className="text-gray-400 block mb-1">Bonus %:</label>
                <div className="flex items-center gap-1 mb-2 w-full">
                  <input 
                    type="number" 
                    placeholder="Min" 
                    value={filters.bonusMin ?? ''}
                    onChange={(e) => updateFilter('bonusMin', e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-gray-800 border border-rcBorder rounded px-1 py-1 text-xs text-white"
                  />
                  <span className="text-gray-500">-</span>
                  <input 
                    type="number" 
                    placeholder="Max" 
                    value={filters.bonusMax ?? ''}
                    onChange={(e) => updateFilter('bonusMax', e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-gray-800 border border-rcBorder rounded px-1 py-1 text-xs text-white"
                  />
                </div>
                <div className="dual-slider">
                  <div className="dual-slider-track"></div>
                  <div className="dual-slider-range" style={getDualSliderStyle('bonus')}></div>
                  <input 
                    type="range" 
                    min={sliderRanges.bonus[0]} 
                    max={sliderRanges.bonus[1]} 
                    value={filters.bonusMin ?? sliderRanges.bonus[0]}
                    onChange={(e) => updateFilter('bonusMin', Number(e.target.value))}
                  />
                  <input 
                    type="range" 
                    min={sliderRanges.bonus[0]} 
                    max={sliderRanges.bonus[1]} 
                    value={filters.bonusMax ?? sliderRanges.bonus[1]}
                    onChange={(e) => updateFilter('bonusMax', Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Price */}
              <div className="border-t border-rcBorder pt-3">
                <label className="text-gray-400 block mb-1">Price (RLT):</label>
                <div className="flex items-center gap-1 mb-2 w-full">
                  <input 
                    type="number" 
                    placeholder="Min" 
                    value={filters.priceMin ?? ''}
                    onChange={(e) => updateFilter('priceMin', e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-gray-800 border border-rcBorder rounded px-1 py-1 text-xs text-white"
                  />
                  <span className="text-gray-500">-</span>
                  <input 
                    type="number" 
                    placeholder="Max" 
                    value={filters.priceMax ?? ''}
                    onChange={(e) => updateFilter('priceMax', e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-gray-800 border border-rcBorder rounded px-1 py-1 text-xs text-white"
                  />
                </div>
                <div className="dual-slider">
                  <div className="dual-slider-track"></div>
                  <div className="dual-slider-range" style={getDualSliderStyle('price')}></div>
                  <input 
                    type="range" 
                    min={sliderRanges.price[0]} 
                    max={sliderRanges.price[1]} 
                    value={filters.priceMin ?? sliderRanges.price[0]}
                    onChange={(e) => updateFilter('priceMin', Number(e.target.value))}
                  />
                  <input 
                    type="range" 
                    min={sliderRanges.price[0]} 
                    max={sliderRanges.price[1]} 
                    value={filters.priceMax ?? sliderRanges.price[1]}
                    onChange={(e) => updateFilter('priceMax', Number(e.target.value))}
                  />
                </div>
              </div>

              {/* XP */}
              <div className="border-t border-rcBorder pt-3">
                <label className="text-gray-400 block mb-1">XP:</label>
                <div className="flex items-center gap-1 mb-2 w-full">
                  <input 
                    type="number" 
                    placeholder="Min" 
                    value={filters.xpMin ?? ''}
                    onChange={(e) => updateFilter('xpMin', e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-gray-800 border border-rcBorder rounded px-1 py-1 text-xs text-white"
                  />
                  <span className="text-gray-500">-</span>
                  <input 
                    type="number" 
                    placeholder="Max" 
                    value={filters.xpMax ?? ''}
                    onChange={(e) => updateFilter('xpMax', e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-gray-800 border border-rcBorder rounded px-1 py-1 text-xs text-white"
                  />
                </div>
                <div className="dual-slider">
                  <div className="dual-slider-track"></div>
                  <div className="dual-slider-range" style={getDualSliderStyle('xp')}></div>
                  <input 
                    type="range" 
                    min={sliderRanges.xp[0]} 
                    max={sliderRanges.xp[1]} 
                    value={filters.xpMin ?? sliderRanges.xp[0]}
                    onChange={(e) => updateFilter('xpMin', Number(e.target.value))}
                  />
                  <input 
                    type="range" 
                    min={sliderRanges.xp[0]} 
                    max={sliderRanges.xp[1]} 
                    value={filters.xpMax ?? sliderRanges.xp[1]}
                    onChange={(e) => updateFilter('xpMax', Number(e.target.value))}
                  />
                </div>
              </div>

              {/* GH/RLT */}
              <div className="border-t border-rcBorder pt-3">
                <label className="text-gray-400 block mb-1">GH/RLT:</label>
                <div className="flex items-center gap-1 mb-2 w-full">
                  <input 
                    type="number" 
                    placeholder="Min" 
                    value={filters.ghrltMin ?? ''}
                    onChange={(e) => updateFilter('ghrltMin', e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-gray-800 border border-rcBorder rounded px-1 py-1 text-xs text-white"
                  />
                  <span className="text-gray-500">-</span>
                  <input 
                    type="number" 
                    placeholder="Max" 
                    value={filters.ghrltMax ?? ''}
                    onChange={(e) => updateFilter('ghrltMax', e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-gray-800 border border-rcBorder rounded px-1 py-1 text-xs text-white"
                  />
                </div>
                <div className="dual-slider">
                  <div className="dual-slider-track"></div>
                  <div className="dual-slider-range" style={getDualSliderStyle('ghrlt')}></div>
                  <input 
                    type="range" 
                    min={sliderRanges.ghrlt[0]} 
                    max={sliderRanges.ghrlt[1]} 
                    value={filters.ghrltMin ?? sliderRanges.ghrlt[0]}
                    onChange={(e) => updateFilter('ghrltMin', Number(e.target.value))}
                  />
                  <input 
                    type="range" 
                    min={sliderRanges.ghrlt[0]} 
                    max={sliderRanges.ghrlt[1]} 
                    value={filters.ghrltMax ?? sliderRanges.ghrlt[1]}
                    onChange={(e) => updateFilter('ghrltMax', Number(e.target.value))}
                  />
                </div>
              </div>

              {/* %/RLT */}
              <div className="border-t border-rcBorder pt-3">
                <label className="text-gray-400 block mb-1">%/RLT:</label>
                <div className="flex items-center gap-1 mb-2 w-full">
                  <input 
                    type="number" 
                    placeholder="Min" 
                    value={filters.perrltMin ?? ''}
                    onChange={(e) => updateFilter('perrltMin', e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-gray-800 border border-rcBorder rounded px-1 py-1 text-xs text-white"
                  />
                  <span className="text-gray-500">-</span>
                  <input 
                    type="number" 
                    placeholder="Max" 
                    value={filters.perrltMax ?? ''}
                    onChange={(e) => updateFilter('perrltMax', e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-gray-800 border border-rcBorder rounded px-1 py-1 text-xs text-white"
                  />
                </div>
                <div className="dual-slider">
                  <div className="dual-slider-track"></div>
                  <div className="dual-slider-range" style={getDualSliderStyle('perrlt')}></div>
                  <input 
                    type="range" 
                    min={sliderRanges.perrlt[0]} 
                    max={sliderRanges.perrlt[1]} 
                    value={filters.perrltMin ?? sliderRanges.perrlt[0]}
                    onChange={(e) => updateFilter('perrltMin', Number(e.target.value))}
                  />
                  <input 
                    type="range" 
                    min={sliderRanges.perrlt[0]} 
                    max={sliderRanges.perrlt[1]} 
                    value={filters.perrltMax ?? sliderRanges.perrlt[1]}
                    onChange={(e) => updateFilter('perrltMax', Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Efficiency */}
              <div className="border-t border-rcBorder pt-3">
                <label className="text-gray-400 block mb-1">Efficiency:</label>
                <div className="flex items-center gap-1 mb-2 w-full">
                  <input 
                    type="number" 
                    placeholder="Min" 
                    value={filters.effMin ?? ''}
                    onChange={(e) => updateFilter('effMin', e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-gray-800 border border-rcBorder rounded px-1 py-1 text-xs text-white"
                  />
                  <span className="text-gray-500">-</span>
                  <input 
                    type="number" 
                    placeholder="Max" 
                    value={filters.effMax ?? ''}
                    onChange={(e) => updateFilter('effMax', e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-gray-800 border border-rcBorder rounded px-1 py-1 text-xs text-white"
                  />
                </div>
                <div className="dual-slider">
                  <div className="dual-slider-track"></div>
                  <div className="dual-slider-range" style={getDualSliderStyle('eff')}></div>
                  <input 
                    type="range" 
                    min={sliderRanges.eff[0]} 
                    max={sliderRanges.eff[1]} 
                    value={filters.effMin ?? sliderRanges.eff[0]}
                    onChange={(e) => updateFilter('effMin', Number(e.target.value))}
                  />
                  <input 
                    type="range" 
                    min={sliderRanges.eff[0]} 
                    max={sliderRanges.eff[1]} 
                    value={filters.effMax ?? sliderRanges.eff[1]}
                    onChange={(e) => updateFilter('effMax', Number(e.target.value))}
                  />
                </div>
              </div>

              {/* XP/RLT */}
              <div className="border-t border-rcBorder pt-3">
                <label className="text-gray-400 block mb-1">XP/RLT:</label>
                <div className="flex items-center gap-1 mb-2 w-full">
                  <input 
                    type="number" 
                    placeholder="Min" 
                    value={filters.xprltMin ?? ''}
                    onChange={(e) => updateFilter('xprltMin', e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-gray-800 border border-rcBorder rounded px-1 py-1 text-xs text-white"
                  />
                  <span className="text-gray-500">-</span>
                  <input 
                    type="number" 
                    placeholder="Max" 
                    value={filters.xprltMax ?? ''}
                    onChange={(e) => updateFilter('xprltMax', e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-gray-800 border border-rcBorder rounded px-1 py-1 text-xs text-white"
                  />
                </div>
                <div className="dual-slider">
                  <div className="dual-slider-track"></div>
                  <div className="dual-slider-range" style={getDualSliderStyle('xprlt')}></div>
                  <input 
                    type="range" 
                    min={sliderRanges.xprlt[0]} 
                    max={sliderRanges.xprlt[1]} 
                    value={filters.xprltMin ?? sliderRanges.xprlt[0]}
                    onChange={(e) => updateFilter('xprltMin', Number(e.target.value))}
                  />
                  <input 
                    type="range" 
                    min={sliderRanges.xprlt[0]} 
                    max={sliderRanges.xprlt[1]} 
                    value={filters.xprltMax ?? sliderRanges.xprlt[1]}
                    onChange={(e) => updateFilter('xprltMax', Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table Section */}
      {globalData.length > 0 && (
        <div className="w-full max-w-[98%] flex flex-col gap-4">
          <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
            <p className="text-sm text-gray-400">
              <span className="font-bold text-white">{filteredData.length}</span> miners found.
            </p>
            <div className="flex gap-4 text-xs items-center flex-wrap">
              <span className="text-gray-500">Note: High points = Power + Higher Bonus</span>
              
              {/* Column Toggle */}
              <div className="relative">
                <button 
                  className="bg-rcCard hover:bg-rcBorder text-gray-300 px-3 py-1.5 rounded-lg border border-rcBorder transition-colors"
                  onClick={() => setShowColDropdown(!showColDropdown)}
                >
                  <i className="fa-solid fa-eye mr-1"></i> Columns
                </button>
                {showColDropdown && (
                  <div className="absolute right-0 mt-1 w-48 bg-rcCard border border-rcBorder rounded-lg shadow-xl z-50">
                    <div className="p-2 text-xs text-gray-400 border-b border-rcBorder">Show/Hide Columns</div>
                    {[
                      { id: 'col-power', label: 'Power (GH/s)' },
                      { id: 'col-bonus', label: 'Bonus %' },
                      { id: 'col-price', label: 'Price' },
                      { id: 'col-ghrlt', label: 'GH/RLT' },
                      { id: 'col-perrlt', label: '%/RLT' },
                      { id: 'col-efficiency', label: 'Efficiency' },
                      { id: 'col-xprlt', label: 'XP/RLT' },
                      { id: 'col-xp', label: 'XP' },
                      { id: 'col-market', label: 'Market' },
                      { id: 'col-ingredients', label: 'Ingredients' },
                    ].map(col => (
                      <label key={col.id} className="flex items-center gap-2 p-2 hover:bg-gray-700/30 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={visibleColumns.has(col.id)} 
                          onChange={() => toggleColumn(col.id)} 
                          className="accent-rcHighlight"
                        />
                        <span>{col.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              
              <button onClick={resetData} className="text-red-400 hover:text-red-300 transition-colors ml-4">
                <i className="fa-solid fa-trash-can mr-1"></i> Load Another File
              </button>
            </div>
          </div>

          {/* Global Apply Button */}
          <div className="mt-4 flex justify-center">
            <button onClick={applyAllFilters} className="bg-rcHighlight hover:bg-blue-500 text-white px-8 py-2 rounded-lg font-medium transition-colors">
              <i className="fa-solid fa-filter mr-2"></i> Apply Filters
            </button>
          </div>

          <div className="bg-rcCard rounded-2xl shadow-xl border border-rcBorder overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap table-auto">
              <thead>
                <tr className="bg-gray-800/50 border-b border-rcBorder text-[10px] uppercase tracking-wider text-gray-300">
                  <th 
                    className="p-3 sortable text-center col-market" 
                    onClick={() => handleSort('Poate fi vândut')}
                    title="Can be sold on Market"
                  >
                    <i className="fa-solid fa-shop"></i>
                  </th>
                  <th className="p-3 sortable" onClick={() => handleSort('Nume Miner')}>
                    Miner <i className="fa-solid fa-sort ml-1 opacity-50"></i>
                  </th>
                  <th 
                    className="p-3 sortable text-right col-power" 
                    onClick={() => handleSort('Putere Rezultat (GH/s)')}
                  >
                    Power (GH/s) <i className="fa-solid fa-sort ml-1 opacity-50"></i>
                  </th>
                  <th 
                    className="p-3 sortable text-right col-bonus" 
                    onClick={() => handleSort('Bonus Rezultat %')}
                  >
                    Bonus % <i className="fa-solid fa-sort ml-1 opacity-50"></i>
                  </th>
                  <th 
                    className="p-3 sortable text-center col-price" 
                    onClick={() => handleSort('Cost RLT/RST')}
                  >
                    Price <i className="fa-solid fa-sort ml-1 opacity-50"></i>
                  </th>
                  
                  <th 
                    className="p-3 sortable text-right bg-blue-900/20 text-blue-200 border-x border-rcBorder/20 col-ghrlt" 
                    onClick={() => handleSort('powerRatio')}
                    title="GH per 1 RLT (Higher is better)"
                  >
                    GH/RLT <i className="fa-solid fa-sort ml-1 opacity-50"></i>
                  </th>
                  <th 
                    className="p-3 sortable text-right bg-blue-900/20 text-blue-200 border-r border-rcBorder/20 col-perrlt" 
                    onClick={() => handleSort('bonusRatio')}
                    title="Bonus % per 1 RLT (Higher is better)"
                  >
                    %/RLT <i className="fa-solid fa-sort ml-1 opacity-50"></i>
                  </th>
                  <th 
                    className="p-3 sortable text-right bg-indigo-900/30 text-rcAccent font-bold col-efficiency" 
                    onClick={() => handleSort('efficiency')}
                    title="Efficiency Points: Power/1M + Bonus%×5.28 (Higher is better)"
                  >
                    Efficiency <i className="fa-solid fa-sort ml-1 opacity-50"></i>
                  </th>
                  <th 
                    className="p-3 sortable text-right bg-purple-900/30 text-purple-200 border-l border-rcBorder/20 col-xprlt" 
                    onClick={() => handleSort('xpRatio')}
                    title="XP per 1 RLT (Higher is better)"
                  >
                    XP/RLT <i className="fa-solid fa-sort ml-1 opacity-50"></i>
                  </th>
                  
                  <th 
                    className="p-3 sortable text-center col-xp" 
                    onClick={() => handleSort('XP Reward')}
                  >
                    XP <i className="fa-solid fa-sort ml-1 opacity-50"></i>
                  </th>
                  <th className="p-3 col-ingredients">
                    Ingredients
                  </th>
                </tr>
              </thead>
              <tbody id="tableBody" className="divide-y divide-rcBorder text-xs">
                {filteredData.map((row: MinerData, idx: number) => (
                  <tr key={idx} className="transition-colors">
                    <td className="p-3 text-center col-market" dangerouslySetInnerHTML={{ __html: getMarketHtml(String(row['Poate fi vândut'])) }} />
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {getLevelIcon(row['Nivel Final'])}
                        <span className="font-semibold text-white truncate max-w-[150px]" title={String(row['Nume Miner'])}>
                          {row['Nume Miner'] || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-right col-power text-rcHighlight font-mono font-medium">
                      {formatNumber(Number(row['Putere Rezultat (GH/s)']), 0)}
                    </td>
                    <td className="p-3 text-right col-bonus font-mono" style={{ color: '#4ade80' }}>
                      {formatNumber(Number(row['Bonus Rezultat %']), 2)}%
                    </td>
                    <td className="p-3 text-center col-price font-mono font-bold" style={{ color: '#facc15' }}>
                      {Number(row['Cost RLT/RST']) > 0 ? formatNumber(Number(row['Cost RLT/RST']), 2) + ' R' : '-'}
                    </td>
                    
                    <td className="p-3 text-right col-ghrlt font-mono" style={{ backgroundColor: 'rgba(59, 130, 246, 0.05)', color: '#93c5fd', borderLeft: '1px solid rgba(65, 72, 104, 0.1)', borderRight: '1px solid rgba(65, 72, 104, 0.1)' }}>
                      {formatNumber(Number(row.powerRatio), 0)}
                    </td>
                    <td className="p-3 text-right col-perrlt font-mono" style={{ backgroundColor: 'rgba(59, 130, 246, 0.05)', color: '#93c5fd', borderRight: '1px solid rgba(65, 72, 104, 0.1)' }}>
                      {formatNumber(Number(row.bonusRatio), 3)}
                    </td>
                    <td className="p-3 text-right col-efficiency font-mono font-bold" style={{ backgroundColor: 'rgba(79, 70, 229, 0.1)', color: '#bb9af7' }}>
                      {formatNumber(Number(row.efficiency), 1)}
                    </td>
                    <td className="p-3 text-right col-xprlt font-mono" style={{ backgroundColor: 'rgba(147, 51, 234, 0.1)', color: '#c084fc', borderLeft: '1px solid rgba(65, 72, 104, 0.2)' }}>
                      {formatNumber(Number(row.xpRatio), 2)}
                    </td>
                    
                    <td className="p-3 text-center col-xp font-bold" style={{ color: '#9ca3af' }}>
                      {formatNumber(Number(row['XP Reward']), 0)}
                    </td>
                    <td className="p-3 col-ingredients" dangerouslySetInnerHTML={{ __html: getIngredientsHtml(row) }} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MergeCalculator;
