'use client';

import React, { useState, useEffect } from 'react';

const InventoryManagement = () => {
  const [inventory, setInventory] = useState(0);
  const [addition, setAddition] = useState('');
  const [updateDate, setUpdateDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryCount, setDeliveryCount] = useState('');
  const [company, setCompany] = useState('');
  const [recipient, setRecipient] = useState('');
  const [person, setPerson] = useState('');
  const [records, setRecords] = useState([]);
  const [resetValue, setResetValue] = useState('');

  const companies = ['SPG', '極光', 'ソフトラン', '桃太郎（藤沢）', '桃太郎（相模原）', 'MJ', 'PS', 'TMG', 'CROUD'];

  // 获取当前日期字符串
  const getCurrentDate = () => {
    const now = new Date();
    return `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
  };

  // 修正按钮 - 将追加数加到在库枚数
  const handleConfirm = () => {
    if (addition && !isNaN(addition)) {
      setInventory(prev => prev + parseInt(addition));
      setUpdateDate(getCurrentDate());
      setAddition('');
    }
  };

  // 重置按钮 - 设置为指定值
  const handleReset = () => {
    if (resetValue === '' || isNaN(resetValue)) {
      alert('请输入有效的数值');
      return;
    }
    const value = parseInt(resetValue);
    if (value < 0) {
      alert('数值不能小于0');
      return;
    }
    setInventory(value);
    setUpdateDate(getCurrentDate());
    setResetValue('');
  };

  // 删除记录
  const handleDelete = (record) => {
    if (window.confirm(`确定要删除这条记录吗？\n日期: ${record.date}\n公司: ${record.company}\n枚数: ${record.deliveryCount}`)) {
      // 从记录列表中删除
      setRecords(prev => prev.filter(r => r.id !== record.id));
      // 将引渡枚数加回到在库枚数
      setInventory(prev => prev + record.deliveryCount);
    }
  };

  // 日期输入时自动更新
  const handleDeliveryDateChange = (value) => {
    setDeliveryDate(value);
  };

  // 保存记录
  const handleSave = () => {
    if (!deliveryDate || !deliveryCount || !company) {
      alert('请填写完整信息：日期、引渡枚数和公司名');
      return;
    }

    const count = parseInt(deliveryCount);
    if (isNaN(count) || count <= 0) {
      alert('请输入有效的引渡枚数');
      return;
    }

    if (count > inventory) {
      alert('引渡枚数不能超过在库枚数');
      return;
    }

    const newRecord = {
      id: Date.now(),
      date: deliveryDate,
      deliveryCount: count,
      company: company,
      recipient: recipient,
      person: person
    };

    setRecords(prev => [...prev, newRecord]);
    setInventory(prev => prev - count);
    
    // 清空输入
    setDeliveryDate('');
    setDeliveryCount('');
    setCompany('');
    setRecipient('');
    setPerson('');
  };

  // 计算每月每家公司的总数
  const getMonthlyStats = () => {
    const stats = {};
    
    records.forEach(record => {
      const date = new Date(record.date);
      const monthKey = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!stats[monthKey]) {
        stats[monthKey] = {};
        companies.forEach(comp => {
          stats[monthKey][comp] = 0;
        });
      }
      
      stats[monthKey][record.company] += record.deliveryCount;
    });
    
    return stats;
  };

  const monthlyStats = getMonthlyStats();

  return (
    <div className="p-6 max-w-[1600px] mx-auto bg-gray-50">
      <h1 className="text-2xl font-bold mb-6 text-black">在库枚数管理系统</h1>
      
      {/* 在库枚数管理区域 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-5 gap-4 items-end mb-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-black">在库枚数</label>
            <div className="text-3xl font-bold text-blue-600">{inventory}</div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-black">追加</label>
            <input
              type="number"
              min="0"
              value={addition}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || parseFloat(value) >= 0) {
                  setAddition(value);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-black"
              placeholder="追加枚数"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-black">重置为</label>
            <input
              type="number"
              min="0"
              value={resetValue}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || parseFloat(value) >= 0) {
                  setResetValue(value);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-black"
              placeholder="指定数值"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-black">更新日期</label>
            <div className="px-3 py-2 bg-gray-100 rounded-md text-black">{updateDate || '未更新'}</div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-medium rounded-md"
            >
              修正
            </button>
            <button
              onClick={handleReset}
              className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-md"
            >
              重置
            </button>
          </div>
        </div>
      </div>

      {/* 引渡记录输入区域 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-black">引渡记录</h2>
        <div className="grid grid-cols-6 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-black">日期</label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => handleDeliveryDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-black">引渡枚数</label>
            <input
              type="number"
              value={deliveryCount}
              onChange={(e) => setDeliveryCount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-black"
              placeholder="枚数"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-black">公司名</label>
            <select
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
            >
              <option value="">选择公司</option>
              {companies.map(comp => (
                <option key={comp} value={comp}>{comp}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-black">受取人</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
              placeholder="受取人"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-black">担当者</label>
            <input
              type="text"
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
              placeholder="担当者"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSave}
              className="w-full px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-medium rounded-md"
            >
              保存
            </button>
          </div>
        </div>
      </div>

      {/* 月度统计表 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-black">月度统计</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-black">月份</th>
                {companies.map(comp => (
                  <th key={comp} className="border border-gray-300 px-4 py-2 text-sm text-black">{comp}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.keys(monthlyStats).sort().reverse().map(month => (
                <tr key={month}>
                  <td className="border border-gray-300 px-4 py-2 font-medium text-black">{month}</td>
                  {companies.map(comp => (
                    <td key={comp} className="border border-gray-300 px-4 py-2 text-center text-black">
                      {monthlyStats[month][comp] || 0}
                    </td>
                  ))}
                </tr>
              ))}
              {Object.keys(monthlyStats).length === 0 && (
                <tr>
                  <td colSpan={companies.length + 1} className="border border-gray-300 px-4 py-2 text-center text-black">
                    暂无数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 引渡记录列表 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 text-black">引渡记录列表</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-black">日期</th>
                <th className="border border-gray-300 px-4 py-2 text-black">引渡枚数</th>
                <th className="border border-gray-300 px-4 py-2 text-black">公司名</th>
                <th className="border border-gray-300 px-4 py-2 text-black">受取人</th>
                <th className="border border-gray-300 px-4 py-2 text-black">担当者</th>
                <th className="border border-gray-300 px-4 py-2 text-black">操作</th>
              </tr>
            </thead>
            <tbody>
              {records.slice().reverse().map(record => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2 text-black">{record.date}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center text-black">{record.deliveryCount}</td>
                  <td className="border border-gray-300 px-4 py-2 text-black">{record.company}</td>
                  <td className="border border-gray-300 px-4 py-2 text-black">{record.recipient}</td>
                  <td className="border border-gray-300 px-4 py-2 text-black">{record.person}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    <button
                      onClick={() => handleDelete(record)}
                      className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-md"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan="6" className="border border-gray-300 px-4 py-2 text-center text-black">
                    暂无记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryManagement;