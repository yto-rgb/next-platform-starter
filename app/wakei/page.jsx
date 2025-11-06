"use client";

import { useState, useEffect } from 'react';

// SVG 图标组件
const Upload = () => (
  <svg className="w-12 h-12 text-indigo-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const Download = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const FileSpreadsheet = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const AlertCircle = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ExcelProcessor = () => {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [xlsxLoaded, setXlsxLoaded] = useState(false);

  // 动态加载 XLSX 库
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    script.onload = () => setXlsxLoaded(true);
    document.head.appendChild(script);
    
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setError('');
      setResult(null);
    }
  };

  const processExcel = async () => {
    if (!file) {
      setError('请先上传 Excel 文件');
      return;
    }

    if (!xlsxLoaded || !window.XLSX) {
      setError('Excel 库加载中，请稍后再试');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const data = await file.arrayBuffer();
      const workbook = window.XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = window.XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        throw new Error('Excel 文件数据不足');
      }

      const headers = jsonData[0];
      const dataRows = jsonData.slice(1);

      const groupedData = {};
      
      dataRows.forEach(row => {
        const institution = row[3] || '未分类';
        const address1 = row[7] || '';
        const address2 = row[8] || '';

        if (!groupedData[institution]) {
          groupedData[institution] = {};
        }

        // 按 address1 (H列) 进行二级分组
        if (address1) {
          if (!groupedData[institution][address1]) {
            groupedData[institution][address1] = [];
          }
          if (address2) {
            groupedData[institution][address1].push(address2);
          }
        }
      });

      const processedData = [];
      
      Object.keys(groupedData).sort().forEach(institution => {
        const cities = groupedData[institution];
        const address1List = Object.keys(cities);

        // 第一行：机构名称
        processedData.push({
          机构: institution,
          受信者住所1: '',
          受信者住所2: '',
          出现次数: ''
        });

        // 遍历每个城市
        address1List.forEach((city, cityIdx) => {
          const districts = cities[city];
          
          // 统计该城市下每个区域的出现次数
          const districtCount = {};
          districts.forEach(district => {
            districtCount[district] = (districtCount[district] || 0) + 1;
          });
          
          // 获取唯一区域并按出现次数排序
          const sortedDistricts = Object.entries(districtCount)
            .sort((a, b) => b[1] - a[1]);
          
          // 第一个区域和城市在同一行
          if (sortedDistricts.length > 0) {
            processedData.push({
              机构: '',
              受信者住所1: city,
              受信者住所2: sortedDistricts[0][0],
              出现次数: sortedDistricts[0][1]
            });
            
            // 其余区域单独一行
            for (let i = 1; i < sortedDistricts.length; i++) {
              processedData.push({
                机构: '',
                受信者住所1: '',
                受信者住所2: sortedDistricts[i][0],
                出现次数: sortedDistricts[i][1]
              });
            }
          } else {
            // 如果没有区域数据，只显示城市
            processedData.push({
              机构: '',
              受信者住所1: city,
              受信者住所2: '',
              出现次数: ''
            });
          }
        });

        // 机构之间添加空行
        processedData.push({
          机构: '',
          受信者住所1: '',
          受信者住所2: '',
          出现次数: ''
        });
      });

      setResult(processedData);
    } catch (err) {
      setError(`处理失败: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const exportExcel = () => {
    if (!result || !window.XLSX) return;

    const ws = window.XLSX.utils.json_to_sheet(result);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, '处理结果');
    
    const fileName = `处理结果_${new Date().toISOString().slice(0, 10)}.xlsx`;
    window.XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <FileSpreadsheet className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-800">Excel 数据处理工具</h1>
          </div>

          <div className="space-y-6">
            {/* 文件上传区域 */}
            <div className="border-2 border-dashed border-indigo-300 rounded-xl p-8 text-center hover:border-indigo-500 transition-colors">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  {file ? file.name : 'Excelをアップロード'}
                </p>
                <p className="text-sm text-gray-500">
                  支持 .xlsx 和 .xls 格式
                </p>
              </label>
            </div>

            {/* 说明文字 */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">処理説明：</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 按 D 列（機関）分類</li>
                <li>• H 列（受信者住所1）的データ抽出</li>
                <li>• 统计 I 列（受信者住所2）的唯一值と個数</li>
                <li>• 新たなExcel 文件エキスパート</li>
              </ul>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-4">
              <button
                onClick={processExcel}
                disabled={!file || processing || !xlsxLoaded}
                className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {!xlsxLoaded ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    加载中...
                  </>
                ) : processing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    处理中...
                  </>
                ) : (
                  '処理スタート'
                )}
              </button>

              {result && (
                <button
                  onClick={exportExcel}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  导出结果
                </button>
              )}
            </div>

            {/* 结果预览 */}
            {result && (
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  处理完成 - 共 {result.length} 行数据
                </h3>
                <div className="bg-white rounded border border-gray-200 p-4 max-h-64 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        {Object.keys(result[0] || {}).map(key => (
                          <th key={key} className="px-3 py-2 text-left font-medium text-gray-700 border-b">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.slice(0, 20).map((row, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          {Object.values(row).map((val, i) => (
                            <td key={i} className="px-3 py-2 text-gray-600">
                              {val || ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {result.length > 20 && (
                    <p className="text-center text-gray-500 text-sm mt-4">
                      仅显示前 20 行，完整数据请导出查看
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcelProcessor;