'use client';

import { useEffect, useMemo, useState } from 'react';

const XLSX_SCRIPT_ID = 'sheetjs-xlsx';
const XLSX_SCRIPT_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';

const carrierMap = {
    '10': 'SPG',
    '11': 'トラサブロウ',
    '15': 'ソフトラン',
    '16': '桃太郎（藤沢）',
    '17': '桃太郎（相模原）',
    '18': 'MJ CONNECT',
    '19': 'P.Sライン合同会社',
    '21': 'TMG',
    '22': '株式会社CROUD',
    '33': '桃太郎（中部）',
    '34': 'ERFOLG',
    '90': 'SPG'
};

const zipKeys = ['邮编', '邮政编码', '郵便番号', '郵便', 'postalCode', 'postal_code', 'postcode', 'zipcode', 'zip'];
const sortCodeKeys = ['仕分けコード', '仕分コード', '仕分け', '仕分', '分拣码', '分拣代码', 'sortCode', 'sort_code'];
const outputHeaders = ['配送公司', '代理店', '邮编', '操作类型'];
const aColumnSortCodeKey = '__aColumnSortCode';
const sortCodeFormat = /^\d{2}-[a-z0-9]{2,3}-\d{2}$/i;

const iconPaths = {
    upload: 'M12 16V4m0 0 4 4m-4-4-4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2',
    download: 'M12 4v12m0 0 4-4m-4 4-4-4M4 18v2h16v-2',
    plus: 'M12 5v14M5 12h14',
    trash: 'M6 7h12M9 7V5h6v2m-8 3 1 9h8l1-9',
    file: 'M7 3h7l5 5v13H7V3Zm7 0v5h5M9 13h6M9 17h6'
};

function Icon({ name, className = 'h-5 w-5' }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path d={iconPaths[name]} />
        </svg>
    );
}

function Button({ children, variant = 'primary', className = '', ...props }) {
    const variants = {
        primary: 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500',
        secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:bg-slate-100 disabled:text-slate-400'
    };

    return (
        <button
            {...props}
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition disabled:cursor-not-allowed ${variants[variant]} ${className}`}
        >
            {children}
        </button>
    );
}

function Panel({ children, className = '' }) {
    return <section className={`rounded-lg border border-slate-200 bg-white p-6 shadow-sm ${className}`}>{children}</section>;
}

function normalizeZip(value) {
    if (value === undefined || value === null) return '';
    const digits = String(value).replace(/[^0-9]/g, '');
    if (!digits) return '';
    return digits.padStart(7, '0').slice(-7);
}

function normalizeLookupKey(value) {
    return String(value ?? '')
        .normalize('NFKC')
        .trim()
        .toLowerCase()
        .replace(/[\s_＿\-‐‑‒–—―－−]+/g, '');
}

function isBlank(value) {
    return value === undefined || value === null || String(value).trim() === '';
}

function normalizeSortCodeValue(value) {
    return String(value ?? '')
        .normalize('NFKC')
        .replace(/[\u200B-\u200D\u2060\uFEFF]/g, '')
        .trim()
        .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u30fc\uff70\u2212]/g, '-');
}

function getCellDisplayValue(cell) {
    return cell?.w ?? cell?.v ?? '';
}

function rowHasData(sheet, xlsx, rowIndex, range) {
    for (let columnIndex = range.s.c; columnIndex <= range.e.c; columnIndex += 1) {
        const cellAddress = xlsx.utils.encode_cell({ c: columnIndex, r: rowIndex });
        if (!isBlank(getCellDisplayValue(sheet[cellAddress]))) {
            return true;
        }
    }

    return false;
}

function getAColumnSortCode(sheet, xlsx, rowIndex) {
    const cellAddress = xlsx.utils.encode_cell({ c: 0, r: rowIndex });
    return normalizeSortCodeValue(getCellDisplayValue(sheet[cellAddress]));
}

function getInvalidAColumnSortCodeRows(sheet, xlsx) {
    const ref = sheet['!ref'];
    if (!ref) return [];

    const range = xlsx.utils.decode_range(ref);
    const invalidRows = [];

    for (let rowIndex = range.s.r + 1; rowIndex <= range.e.r; rowIndex += 1) {
        if (!rowHasData(sheet, xlsx, rowIndex, range)) continue;

        if (!sortCodeFormat.test(getAColumnSortCode(sheet, xlsx, rowIndex))) {
            invalidRows.push(rowIndex + 1);
        }
    }

    return invalidRows;
}

function attachAColumnSortCodes(rows, sheet, xlsx) {
    return rows.map((row, index) => {
        const rowIndex = typeof row.__rowNum__ === 'number' ? row.__rowNum__ : index + 1;

        return {
            ...row,
            [aColumnSortCodeKey]: getAColumnSortCode(sheet, xlsx, rowIndex)
        };
    });
}

function getCell(row, keys) {
    const normalizedKeys = keys.map(normalizeLookupKey);

    for (const key of keys) {
        const value = row[key];
        if (!isBlank(value)) {
            return value;
        }
    }

    for (const [key, value] of Object.entries(row)) {
        if (isBlank(value)) continue;

        const normalizedKey = normalizeLookupKey(key);
        const keyMatched = normalizedKeys.some(
            (targetKey) => normalizedKey === targetKey || normalizedKey.includes(targetKey)
        );

        if (keyMatched) {
            return value;
        }
    }

    return '';
}

function getSortCodePrefix(value) {
    if (value === undefined || value === null) return '';
    const text = String(value)
        .normalize('NFKC')
        .trim()
        .replace(/[＿_－‐‑‒–—―−]/g, '-');
    if (!text) return '';

    const digitGroups = text.match(/\d+/g) || [];
    if (!digitGroups.length) return '';

    const suffix = digitGroups.join('').slice(-2);
    return carrierMap[suffix] ? suffix : '';
}

function getCarrierCodeFromRow(row) {
    const aColumnCarrierCode = getSortCodePrefix(row[aColumnSortCodeKey]);
    if (aColumnCarrierCode) return aColumnCarrierCode;

    const sortCode = getCell(row, sortCodeKeys);
    const carrierCode = getSortCodePrefix(sortCode);
    if (carrierCode) return carrierCode;

    for (const [key, value] of Object.entries(row)) {
        const normalizedKey = normalizeLookupKey(key);
        const looksLikeSortCodeColumn = normalizedKey.includes('仕分') || normalizedKey.includes('分拣') || normalizedKey.includes('sort');

        if (looksLikeSortCodeColumn) {
            const inferredCode = getSortCodePrefix(value);
            if (inferredCode) return inferredCode;
        }
    }

    return '';
}

function ensureXlsxLoaded(onReady, onError) {
    if (typeof window === 'undefined') return;

    if (window.XLSX) {
        onReady();
        return;
    }

    let script = document.getElementById(XLSX_SCRIPT_ID);

    if (!script) {
        script = document.createElement('script');
        script.id = XLSX_SCRIPT_ID;
        script.src = XLSX_SCRIPT_SRC;
        script.async = true;
        document.head.appendChild(script);
    }

    script.addEventListener('load', onReady, { once: true });
    script.addEventListener('error', onError, { once: true });
}

export default function ExcelConverterWebsite() {
    const [fileName, setFileName] = useState('');
    const [sourceRows, setSourceRows] = useState([]);
    const [agents, setAgents] = useState(['']);
    const [operation, setOperation] = useState('1');
    const [manualCarrierCode, setManualCarrierCode] = useState('');
    const [useManualCarrier, setUseManualCarrier] = useState(false);
    const [xlsxReady, setXlsxReady] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        ensureXlsxLoaded(
            () => {
                setXlsxReady(true);
                setError('');
            },
            () => setError('Excel 解析库加载失败，请检查网络后刷新页面。')
        );
    }, []);

    const carrierOptions = useMemo(
        () =>
            Object.entries(carrierMap).map(([code, name]) => ({
                code,
                name,
                label: `${code} - ${name}`
            })),
        []
    );

    const outputRows = useMemo(() => {
        const validAgents = agents.map((value) => value.trim()).filter(Boolean);

        return sourceRows.flatMap((row) => {
            const zip = normalizeZip(getCell(row, zipKeys));
            if (!zip) return [];

            const carrierCode = useManualCarrier ? manualCarrierCode : getCarrierCodeFromRow(row);
            const carrierName = carrierMap[carrierCode] || carrierCode || '';

            return validAgents.map((agent) => ({
                配送公司: carrierName,
                代理店: agent,
                邮编: zip,
                操作类型: operation
            }));
        });
    }, [sourceRows, agents, operation, manualCarrierCode, useManualCarrier]);

    const handleFile = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!window.XLSX) {
            setError('Excel 解析库还没有加载完成，请稍后再试。');
            return;
        }

        try {
            setError('');
            setFileName(file.name);

            const buffer = await file.arrayBuffer();
            const workbook = window.XLSX.read(buffer, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];

            if (!firstSheetName) {
                throw new Error('没有找到可读取的工作表。');
            }

            const sheet = workbook.Sheets[firstSheetName];
            const invalidAColumnRows = getInvalidAColumnSortCodeRows(sheet, window.XLSX);

            if (invalidAColumnRows.length) {
                const rowList = invalidAColumnRows.slice(0, 5).join(', ');
                const totalText = invalidAColumnRows.length > 5 ? `；共 ${invalidAColumnRows.length} 行不符合` : '';
                throw new Error(`上传数据 A 列格式错误：第 ${rowList} 行必须是 XX-XX-XX 或 XX-XXX-XX，中间段可包含数字或字母，例如 71-11B-21${totalText}。`);
            }

            const rows = window.XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
            setSourceRows(attachAColumnSortCodes(rows, sheet, window.XLSX));
        } catch (err) {
            setSourceRows([]);
            setError(err.message || 'Excel 文件读取失败。');
        }
    };

    const addAgent = () => setAgents((current) => [...current, '']);

    const updateAgent = (index, value) => {
        setAgents((current) => current.map((agent, agentIndex) => (agentIndex === index ? value : agent)));
    };

    const removeAgent = (index) => {
        setAgents((current) => {
            if (current.length === 1) return current;
            return current.filter((_, agentIndex) => agentIndex !== index);
        });
    };

    const downloadExcel = () => {
        if (!outputRows.length || !window.XLSX) return;

        const worksheet = window.XLSX.utils.json_to_sheet(outputRows, { header: outputHeaders, skipHeader: true });
        const workbook = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(workbook, worksheet, '关系表');
        window.XLSX.writeFile(workbook, '代理店配送公司关系表.xlsx');
    };

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6">
            <div className="mx-auto max-w-6xl space-y-6">
                <section className="rounded-lg bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-950">Excel 关系表生成工具</h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                                上传 Excel 后，按邮编和仕分けコード生成配送公司、代理店、邮编、操作类型四列数据。
                            </p>
                        </div>
                        <div className="rounded-md bg-slate-100 px-4 py-3 text-sm text-slate-600">
                            <div className="font-semibold text-slate-900">输出列</div>
                            <div className="mt-1">配送公司 / 代理店 / 邮编 / 操作类型</div>
                        </div>
                    </div>
                </section>

                {error && (
                    <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-3">
                    <Panel className="lg:col-span-1">
                        <div className="space-y-6">
                            <div>
                                <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-950">
                                    <Icon name="upload" /> 上传 Excel
                                </h2>
                                <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition hover:bg-slate-100">
                                    <Icon name="file" className="mb-3 h-10 w-10 text-slate-500" />
                                    <span className="font-medium">选择 .xlsx / .xls 文件</span>
                                    <span className="mt-1 text-sm text-slate-500">
                                        {xlsxReady ? '读取第一个工作表的数据' : 'Excel 解析库加载中...'}
                                    </span>
                                    <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} disabled={!xlsxReady} />
                                </label>
                                {fileName && <p className="mt-3 text-sm text-slate-600">已上传：{fileName}</p>}
                            </div>

                            <div>
                                <h2 className="text-xl font-semibold text-slate-950">操作类型</h2>
                                <select
                                    value={operation}
                                    onChange={(event) => setOperation(event.target.value)}
                                    className="mt-3 w-full rounded-md border border-slate-300 bg-white p-3 text-sm text-slate-900"
                                >
                                    <option value="1">1 - 增加</option>
                                    <option value="0">0 - 删除</option>
                                </select>
                            </div>

                            <div>
                                <h2 className="text-xl font-semibold text-slate-950">配送公司生成方式</h2>
                                <div className="mt-3 space-y-3 rounded-lg bg-slate-50 p-4 text-sm">
                                    <label className="flex items-center gap-2">
                                        <input type="radio" checked={!useManualCarrier} onChange={() => setUseManualCarrier(false)} />
                                        从仕分けコード自动识别
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input type="radio" checked={useManualCarrier} onChange={() => setUseManualCarrier(true)} />
                                        手动指定配送公司
                                    </label>
                                    {useManualCarrier && (
                                        <select
                                            value={manualCarrierCode}
                                            onChange={(event) => setManualCarrierCode(event.target.value)}
                                            className="w-full rounded-md border border-slate-300 bg-white p-3 text-sm text-slate-900"
                                        >
                                            <option value="">请选择配送公司</option>
                                            {carrierOptions.map((item) => (
                                                <option key={item.code} value={item.code}>
                                                    {item.label}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Panel>

                    <Panel className="lg:col-span-2">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="text-xl font-semibold text-slate-950">代理店设置</h2>
                                <Button type="button" onClick={addAgent}>
                                    <Icon name="plus" className="h-4 w-4" /> 添加
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {agents.map((agent, index) => (
                                    <div key={index} className="flex gap-3">
                                        <input
                                            value={agent}
                                            onChange={(event) => updateAgent(index, event.target.value)}
                                            placeholder="请输入代理店"
                                            className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white p-3 text-sm text-slate-900"
                                        />
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => removeAgent(index)}
                                            disabled={agents.length === 1}
                                            aria-label="删除代理店"
                                            className="w-10 px-0"
                                        >
                                            <Icon name="trash" className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="rounded-lg bg-slate-100 p-4">
                                    <div className="text-sm text-slate-500">源数据行数</div>
                                    <div className="mt-1 text-2xl font-bold text-slate-950">{sourceRows.length}</div>
                                </div>
                                <div className="rounded-lg bg-slate-100 p-4">
                                    <div className="text-sm text-slate-500">代理店数量</div>
                                    <div className="mt-1 text-2xl font-bold text-slate-950">{agents.filter((value) => value.trim()).length}</div>
                                </div>
                                <div className="rounded-lg bg-slate-100 p-4">
                                    <div className="text-sm text-slate-500">生成行数</div>
                                    <div className="mt-1 text-2xl font-bold text-slate-950">{outputRows.length}</div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button type="button" onClick={downloadExcel} disabled={!outputRows.length || !xlsxReady}>
                                    <Icon name="download" className="h-4 w-4" /> 下载 Excel
                                </Button>
                            </div>

                            <div className="overflow-x-auto rounded-lg border border-slate-200">
                                <table className="w-full min-w-[640px] text-left text-sm">
                                    <thead className="bg-slate-100 text-slate-600">
                                        <tr>
                                            {outputHeaders.map((header) => (
                                                <th key={header} className="p-3 font-semibold">
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {outputRows.length ? (
                                            outputRows.slice(0, 10).map((row, index) => (
                                                <tr key={`${row.邮编}-${row.代理店}-${index}`} className="border-t border-slate-100">
                                                    <td className="p-3">{row.配送公司}</td>
                                                    <td className="p-3 font-semibold">{row.代理店}</td>
                                                    <td className="p-3">{row.邮编}</td>
                                                    <td className="p-3">{row.操作类型}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="p-8 text-center text-slate-500">
                                                    上传 Excel 并填写代理店后会显示预览
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {outputRows.length > 10 && <p className="text-sm text-slate-500">当前仅预览前 10 行。</p>}
                        </div>
                    </Panel>
                </div>
            </div>
        </main>
    );
}
