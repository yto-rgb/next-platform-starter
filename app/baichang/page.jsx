'use client';

import React, { useState, useEffect } from 'react';

export default function ExpenseTracker() {
  const [rows, setRows] = useState([]);

  // 从localStorage加载数据
  useEffect(() => {
    const savedData = localStorage.getItem('expense-data');
    if (savedData) {
      try {
        setRows(JSON.parse(savedData));
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    }
  }, []);

  // 保存数据到localStorage
  const saveData = (newRows) => {
    try {
      localStorage.setItem('expense-data', JSON.stringify(newRows));
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  };

  const addRow = () => {
    const newRow = {
      id: Date.now(),
      no: rows.length + 1,
      huoseNumber: '',
      deliveryCompany: '',
      acceptor: '',
      itemPrice: '',
      fee: '',
      total: '',
      paymentMethod: '現金書留',
      details: ''
    };
    const newRows = [...rows, newRow];
    setRows(newRows);
    saveData(newRows);
  };

  const deleteRow = (id) => {
    const newRows = rows
      .filter(row => row.id !== id)
      .map((row, index) => ({ ...row, no: index + 1 }));
    setRows(newRows);
    saveData(newRows);
  };

  const updateRow = (id, field, value) => {
    const newRows = rows.map(row => {
      if (row.id === id) {
        const updatedRow = { ...row, [field]: value };
        
        // 自动计算总额
        if (field === 'itemPrice' || field === 'fee') {
          const itemPrice = parseFloat(field === 'itemPrice' ? value : row.itemPrice) || 0;
          const fee = parseFloat(field === 'fee' ? value : row.fee) || 0;
          updatedRow.total = itemPrice + fee;
        }
        
        return updatedRow;
      }
      return row;
    });
    setRows(newRows);
    saveData(newRows);
  };

  // 格式化金额显示
  const formatCurrency = (value) => {
    if (!value && value !== 0) return '';
    return `¥${Number(value).toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-[1600px] mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-orange-400 to-orange-500 p-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">10月賠償リスト</h1>
            <button
              onClick={addRow}
              className="bg-white text-orange-500 px-4 py-2 rounded-lg font-medium hover:bg-orange-50 transition-colors flex items-center gap-2"
            >
              <span className="text-xl">+</span>
              行を追加
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-orange-200">
                  <th className="px-3 py-3 text-left font-semibold border border-orange-300 w-8">No.</th>
                  <th className="px-3 py-3 text-left font-semibold border border-orange-300 w-32">HUOSE番号</th>
                  <th className="px-3 py-3 text-left font-semibold border border-orange-300 w-32">配送業者</th>
                  <th className="px-3 py-3 text-left font-semibold border border-orange-300 w-18">了承</th>
                  <th className="px-3 py-3 text-left font-semibold border border-orange-300 w-22">品代金</th>
                  <th className="px-3 py-3 text-left font-semibold border border-orange-300 w-18">手数料</th>
                  <th className="px-3 py-3 text-left font-semibold border border-orange-300 w-20">総額</th>
                  <th className="px-3 py-3 text-left font-semibold border border-orange-300 w-26">支払い方法</th>
                  <th className="px-3 py-3 text-left font-semibold border border-orange-300 w-48">詳細</th>
                  <th className="px-3 py-3 text-center font-semibold border border-orange-300 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-3 py-8 text-center text-gray-400 border border-gray-200">
                      「行を追加」ボタンをクリックしてデータを入力してください
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} className="hover:bg-orange-50 transition-colors">
                      <td className="px-3 py-2 border border-gray-200 text-center font-medium text-gray-800">
                        {row.no}
                      </td>
                      <td className="px-3 py-2 border border-gray-200">
                        <input
                          type="text"
                          value={row.huoseNumber}
                          onChange={(e) => updateRow(row.id, 'huoseNumber', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800"
                          placeholder="番号を入力"
                        />
                      </td>
                      <td className="px-3 py-2 border border-gray-200">
                        <select
                          value={row.deliveryCompany}
                          onChange={(e) => updateRow(row.id, 'deliveryCompany', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800"
                        >
                          <option value="">選択してください</option>
                          <option value="SPG">SPG</option>
                          <option value="極光">極光</option>
                          <option value="ソフトラン">ソフトラン</option>
                          <option value="桃太郎（藤沢）">桃太郎（藤沢）</option>
                          <option value="桃太郎（相模原）">桃太郎（相模原）</option>
                          <option value="MJ">MJ</option>
                          <option value="PSL">PSL</option>
                          <option value="TMG">TMG</option>
                          <option value="CROUD">CROUD</option>
                        </select>
                      </td>
                      <td className="px-3 py-2 border border-gray-200">
                        <input
                          type="text"
                          value={row.acceptor}
                          onChange={(e) => updateRow(row.id, 'acceptor', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800"
                          placeholder=""
                        />
                      </td>
                      <td className="px-3 py-2 border border-gray-200">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-800">¥</span>
                          <input
                            type="text"
                            value={row.itemPrice}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^\d]/g, '');
                              updateRow(row.id, 'itemPrice', value);
                            }}
                            className="w-full pl-6 pr-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800"
                            placeholder="0"
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2 border border-gray-200">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-800">¥</span>
                          <input
                            type="text"
                            value={row.fee}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^\d]/g, '');
                              updateRow(row.id, 'fee', value);
                            }}
                            className="w-full pl-6 pr-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800"
                            placeholder="0"
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2 border border-gray-200 bg-orange-50">
                        <div className="w-full px-2 py-1 font-medium text-gray-800">
                          {formatCurrency(row.total)}
                        </div>
                      </td>
                      <td className="px-3 py-2 border border-gray-200">
                        <select
                          value={row.paymentMethod}
                          onChange={(e) => updateRow(row.id, 'paymentMethod', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800"
                        >
                          <option value="現金書留">現金書留</option>
                          <option value="銀行振込">銀行振込</option>
                        </select>
                      </td>
                      <td className="px-3 py-2 border border-gray-200">
                        <input
                          type="text"
                          value={row.details}
                          onChange={(e) => updateRow(row.id, 'details', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800"
                          placeholder="詳細"
                        />
                      </td>
                      <td className="px-3 py-2 border border-gray-200 text-center">
                        <button
                          onClick={() => deleteRow(row.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded transition-colors"
                          title="削除"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              合計行数: <span className="font-semibold">{rows.length}</span>
            </div>
            <div className="text-sm text-gray-500">
              データは自動的に保存されます
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}