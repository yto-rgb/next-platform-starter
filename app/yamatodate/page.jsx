'use client';

import { useState } from 'react';

export default function CSVProcessor() {
  const [activeTab, setActiveTab] = useState('tokyo-yotei');
  const [csvData, setCsvData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const tabs = [
    { id: 'tokyo-yotei', label: '東京予定データ', city: 'tokyo', type: 'yotei' },
    { id: 'tokyo-kakutei', label: '東京確定データ', city: 'tokyo', type: 'kakutei' },
    { id: 'osaka-yotei', label: '大阪予定データ', city: 'osaka', type: 'yotei' },
    { id: 'osaka-kakutei', label: '大阪確定データ', city: 'osaka', type: 'kakutei' },
  ];

  const parseCSV = (text) => {
    const lines = text.split('\n');
    return lines.map(line => {
      const cells = [];
      let cell = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          cells.push(cell);
          cell = '';
        } else {
          cell += char;
        }
      }
      cells.push(cell);
      return cells;
    });
  };

  const csvToString = (data) => {
    return data.map(row => 
      row.map(cell => {
        const str = String(cell || '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    ).join('\n');
  };

  const processYoteiData = (data, city) => {
    if (data.length < 2) {
      throw new Error('データが不足しています');
    }

    const processed = data.map((row) => [...row]);
    
    // A1の??を削除（半角・全角両方対応）
    if (processed[0] && processed[0][0]) {
      processed[0][0] = processed[0][0].replace(/？？/g, '').replace(/\?\?/g, '');
    }

    // A列とB列の検証（2行目以降）
    for (let i = 1; i < processed.length; i++) {
      const aVal = processed[i][0];
      const bVal = processed[i][1];
      if (aVal && bVal && aVal !== bVal) {
        throw new Error(`${i + 1}行目: A列(${aVal})とB列(${bVal})が一致しません`);
      }
    }

    // R列（17列目）に運賃請求先コードを設定
    const code = city === 'osaka' ? '072463680100' : '072463680198';
    for (let i = 0; i < processed.length; i++) {
      while (processed[i].length < 18) {
        processed[i].push('');
      }
      processed[i][17] = code;
    }

    // M列（12列目）の荷送人名を10文字以内に
    for (let i = 0; i < processed.length; i++) {
      if (processed[i][12]) {
        const text = String(processed[i][12]);
        processed[i][12] = text.substring(0, 10);
      }
    }

    return processed;
  };

  const processKakuteiData = (data, city) => {
    if (data.length < 2) {
      throw new Error('データが不足しています');
    }

    const processed = [];
    const code = city === 'osaka' ? '072463680100' : '072463680198';
    
    // 1行目（ヘッダー行）をそのまま保持（A1も変更しない）
    processed.push([...data[0]]);
    
    // 2行目に空白行を挿入（A2も空白のまま）
    const emptyRow = new Array(data[0].length).fill('');
    processed.push(emptyRow);
    
    // 3行目以降：元のデータの2行目以降を追加し、A列のコードを置換
    for (let i = 1; i < data.length; i++) {
      const row = [...data[i]];
      // A列の運賃請求先コードを置換
      if (row[0]) {
        row[0] = code;
      }
      processed.push(row);
    }

    return processed;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setError('');
    setSuccess('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const data = parseCSV(text);
        setCsvData(data);
        setSuccess('CSVファイルを読み込みました');
      } catch (err) {
        setError('CSVファイルの読み込みに失敗しました');
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleExport = () => {
    if (csvData.length === 0) {
      setError('CSVデータがありません');
      return;
    }

    setError('');
    setSuccess('');

    try {
      const currentTab = tabs.find(t => t.id === activeTab);
      let processed;

      if (currentTab.type === 'yotei') {
        processed = processYoteiData(csvData, currentTab.city);
      } else {
        processed = processKakuteiData(csvData, currentTab.city);
      }

      const csvString = csvToString(processed);
      
      // UTF-8 BOM付きで出力（Excelで正しく開けるように）
      const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
      const encoder = new TextEncoder();
      const csvDataEncoded = encoder.encode(csvString);
      
      const blob = new Blob([bom, csvDataEncoded], { 
        type: 'text/csv;charset=utf-8;' 
      });
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `processed_${currentTab.id}_${Date.now()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccess('CSVファイルをエクスポートしました');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
          CSV データ処理システム
        </h1>

        <div className="bg-white rounded-lg shadow-lg mb-6 overflow-hidden">
          <div className="flex flex-wrap border-b">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCsvData([]);
                  setFileName('');
                  setError('');
                  setSuccess('');
                }}
                className={`flex-1 min-w-[200px] px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white border-b-4 border-indigo-700'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-8">
            <div className="mb-6">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                CSVファイルを選択
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg cursor-pointer hover:bg-indigo-700 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                  </svg>
                  <span>ファイルを選択</span>
                  <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                </label>
                {fileName && <span className="text-sm text-gray-600">選択中: {fileName}</span>}
              </div>
            </div>

            {csvData.length > 0 && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-700">
                  読み込みデータ: {csvData.length}行 × {csvData[0]?.length || 0}列
                </p>
              </div>
            )}

            <button
              onClick={handleExport}
              disabled={csvData.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
              </svg>
              <span>処理してエクスポート</span>
            </button>

            {error && (
              <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
                <div className="flex items-start gap-3">
                  <svg className="text-red-500 flex-shrink-0 mt-0.5" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-500 rounded">
                <div className="flex items-start gap-3">
                  <svg className="text-green-500 flex-shrink-0 mt-0.5" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  <p className="text-green-700">{success}</p>
                </div>
              </div>
            )}

            <div className="mt-8 p-6 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">
                {tabs.find(t => t.id === activeTab)?.label} の処理内容
              </h3>
              {activeTab.includes('yotei') ? (
                <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
                  <li>A1セルの「??」を削除</li>
                  <li>A列とB列（2行目以降）の値が一致するか検証</li>
                  <li>R列に運賃請求先コード（{activeTab.includes('osaka') ? '072463680100' : '072463680198'}）を設定</li>
                  <li>M列の荷送人名を10文字以内に制限</li>
                </ul>
              ) : (
                <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
                  <li>1行目：ヘッダー行をそのまま保持</li>
                  <li>2行目：空白行を挿入</li>
                  <li>3行目以降：元データを追加し、A列のコードを（{activeTab.includes('osaka') ? '072463680100' : '072463680198'}）に置換</li>
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}