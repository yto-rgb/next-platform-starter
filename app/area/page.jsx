'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    CheckCircle,
    DownloadSimple,
    FileXls,
    GearSix,
    Table,
    UploadSimple,
    WarningCircle
} from 'phosphor-react';

const XLSX_SCRIPT_ID = 'sheetjs-xlsx';
const XLSX_SCRIPT_SRC = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';

const DEFAULT_KANTO = ['東京都', '神奈川県', '埼玉県', '千葉県', '茨城県', '栃木県', '群馬県'];
const DEFAULT_KANSAI = ['大阪府', '京都府', '兵庫県', '奈良県', '滋賀県', '和歌山県'];

const statusStyles = {
    idle: 'border-slate-200 bg-white text-slate-700',
    loading: 'border-sky-200 bg-sky-50 text-sky-800',
    ok: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    error: 'border-rose-200 bg-rose-50 text-rose-800',
    warn: 'border-amber-200 bg-amber-50 text-amber-800'
};

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

function Button({ children, variant = 'primary', className = '', ...props }) {
    const variants = {
        primary: 'bg-slate-950 text-white hover:bg-slate-800 disabled:bg-slate-300 disabled:text-slate-500',
        secondary:
            'border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-100 disabled:bg-slate-100 disabled:text-slate-400'
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

function normalizeForMatch(value) {
    return String(value ?? '')
        .normalize('NFKC')
        .replace(/[\u200B-\u200D\u2060\uFEFF]/g, '')
        .replace(/\u3000/g, ' ')
        .trim()
        .replace(/\s+/g, '');
}

function parseAreaList(value) {
    return String(value ?? '')
        .split(/[\s,，、;；|]+/)
        .map((item) => item.trim())
        .filter(Boolean);
}

function makeAreaSet(value) {
    const areas = parseAreaList(value);
    const normalized = new Map();

    for (const area of areas) {
        const key = normalizeForMatch(area);

        if (key) {
            normalized.set(key, area);
        }
    }

    return normalized;
}

function getCellText(cell) {
    return String(cell?.w ?? cell?.v ?? '').trim();
}

function getCColumnText(sheet, rowIndex, xlsx) {
    const address = xlsx.utils.encode_cell({ r: rowIndex, c: 2 });
    return getCellText(sheet[address]);
}

function rowHasData(sheet, rowIndex, range, xlsx) {
    for (let columnIndex = range.s.c; columnIndex <= range.e.c; columnIndex += 1) {
        const address = xlsx.utils.encode_cell({ r: rowIndex, c: columnIndex });

        if (getCellText(sheet[address])) {
            return true;
        }
    }

    return false;
}

function matchArea(addressText, areaKeys) {
    const normalizedAddress = normalizeForMatch(addressText);

    if (!normalizedAddress) return '';

    for (const key of areaKeys) {
        if (normalizedAddress === key || normalizedAddress.startsWith(key)) {
            return key;
        }
    }

    return '';
}

function safeSheetName(name) {
    return String(name || 'Sheet')
        .replace(/[\\/?*[\]:]/g, '_')
        .slice(0, 31);
}

function clonePlain(value) {
    if (!value || typeof value !== 'object') return value;

    try {
        return JSON.parse(JSON.stringify(value));
    } catch {
        return value;
    }
}

function cloneCell(cell) {
    if (!cell) return undefined;

    return clonePlain(cell);
}

function canCopyMerge(merge, rowMap) {
    const targetStart = rowMap.get(merge.s.r);

    if (targetStart === undefined) return false;

    for (let rowIndex = merge.s.r; rowIndex <= merge.e.r; rowIndex += 1) {
        const targetRow = rowMap.get(rowIndex);

        if (targetRow === undefined || targetRow !== targetStart + (rowIndex - merge.s.r)) {
            return false;
        }
    }

    return true;
}

function buildFilteredSheet(sourceSheet, range, sourceRows, xlsx) {
    const targetSheet = {};
    const rowsToCopy = [range.s.r, ...sourceRows];
    const rowMap = new Map(rowsToCopy.map((sourceRow, targetRow) => [sourceRow, targetRow]));
    const columnOffset = range.s.c;

    rowsToCopy.forEach((sourceRow, targetRow) => {
        for (let sourceColumn = range.s.c; sourceColumn <= range.e.c; sourceColumn += 1) {
            const sourceAddress = xlsx.utils.encode_cell({ r: sourceRow, c: sourceColumn });
            const cell = cloneCell(sourceSheet[sourceAddress]);

            if (cell) {
                const targetAddress = xlsx.utils.encode_cell({
                    r: targetRow,
                    c: sourceColumn - columnOffset
                });
                targetSheet[targetAddress] = cell;
            }
        }
    });

    targetSheet['!ref'] = xlsx.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: Math.max(rowsToCopy.length - 1, 0), c: range.e.c - columnOffset }
    });

    if (sourceSheet['!cols']) {
        targetSheet['!cols'] = clonePlain(sourceSheet['!cols'].slice(columnOffset, range.e.c + 1));
    }

    if (sourceSheet['!rows']) {
        targetSheet['!rows'] = rowsToCopy.map((sourceRow) => clonePlain(sourceSheet['!rows'][sourceRow] || {}));
    }

    if (sourceSheet['!merges']) {
        targetSheet['!merges'] = sourceSheet['!merges']
            .filter((merge) => merge.s.c >= range.s.c && merge.e.c <= range.e.c && canCopyMerge(merge, rowMap))
            .map((merge) => ({
                s: { r: rowMap.get(merge.s.r), c: merge.s.c - columnOffset },
                e: { r: rowMap.get(merge.e.r), c: merge.e.c - columnOffset }
            }));
    }

    if (rowsToCopy.length > 1) {
        targetSheet['!autofilter'] = { ref: targetSheet['!ref'] };
    }

    return targetSheet;
}

function baseFileName(fileName) {
    return (fileName || '地址分类').replace(/\.[^.]+$/, '');
}

function StatusBox({ status }) {
    const Icon = status.type === 'error' ? WarningCircle : status.type === 'ok' ? CheckCircle : FileXls;

    return (
        <div className={`rounded-md border px-4 py-3 text-sm leading-6 ${statusStyles[status.type] || statusStyles.idle}`}>
            <div className="flex items-start gap-2">
                <Icon className="mt-0.5 h-4 w-4 shrink-0" weight="bold" />
                <span className="whitespace-pre-line">{status.text}</span>
            </div>
        </div>
    );
}

function StatCard({ label, value, accent = 'bg-slate-100 text-slate-950' }) {
    return (
        <div className={`rounded-lg p-4 ${accent}`}>
            <div className="text-sm opacity-75">{label}</div>
            <div className="mt-1 text-2xl font-bold">{value}</div>
        </div>
    );
}

export default function AreaSplitPage() {
    const [xlsxReady, setXlsxReady] = useState(false);
    const [fileName, setFileName] = useState('');
    const [sourceInfo, setSourceInfo] = useState(null);
    const [kantoText, setKantoText] = useState(DEFAULT_KANTO.join('\n'));
    const [kansaiText, setKansaiText] = useState(DEFAULT_KANSAI.join('\n'));
    const [includeUnmatched, setIncludeUnmatched] = useState(true);
    const [status, setStatus] = useState({
        type: 'loading',
        text: 'Excel 解析库加载中...'
    });

    useEffect(() => {
        ensureXlsxLoaded(
            () => {
                setXlsxReady(true);
                setStatus({ type: 'idle', text: '请选择 Excel 文件。' });
            },
            () => {
                setStatus({
                    type: 'error',
                    text: 'Excel 解析库加载失败，请确认网络可用后刷新页面。'
                });
            }
        );
    }, []);

    const kantoAreas = useMemo(() => makeAreaSet(kantoText), [kantoText]);
    const kansaiAreas = useMemo(() => makeAreaSet(kansaiText), [kansaiText]);

    const duplicateAreas = useMemo(() => {
        const duplicates = [];

        for (const [key, label] of kantoAreas.entries()) {
            if (kansaiAreas.has(key)) {
                duplicates.push(label);
            }
        }

        return duplicates;
    }, [kantoAreas, kansaiAreas]);

    const classification = useMemo(() => {
        if (!sourceInfo || !xlsxReady || !window.XLSX) {
            return {
                kanto: [],
                kansai: [],
                unmatched: [],
                preview: []
            };
        }

        const kantoKeys = [...kantoAreas.keys()];
        const kansaiKeys = [...kansaiAreas.keys()];
        const result = {
            kanto: [],
            kansai: [],
            unmatched: [],
            preview: []
        };

        for (const rowIndex of sourceInfo.dataRows) {
            const address = getCColumnText(sourceInfo.sheet, rowIndex, window.XLSX);
            const kantoMatch = matchArea(address, kantoKeys);
            const kansaiMatch = matchArea(address, kansaiKeys);
            let group = '未分类';

            if (kantoMatch && !kansaiMatch) {
                result.kanto.push(rowIndex);
                group = '关东';
            } else if (kansaiMatch && !kantoMatch) {
                result.kansai.push(rowIndex);
                group = '关西';
            } else if (kantoMatch && kansaiMatch) {
                result.unmatched.push(rowIndex);
                group = '重复配置';
            } else {
                result.unmatched.push(rowIndex);
            }

            if (result.preview.length < 12) {
                result.preview.push({
                    rowNumber: rowIndex + 1,
                    address: address || '-',
                    group
                });
            }
        }

        return result;
    }, [sourceInfo, kantoAreas, kansaiAreas, xlsxReady]);

    const handleFile = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file) return;

        if (!window.XLSX) {
            setStatus({ type: 'error', text: 'Excel 解析库还没有加载完成。' });
            return;
        }

        try {
            setStatus({ type: 'loading', text: '正在读取文件...' });
            setSourceInfo(null);
            setFileName(file.name);

            const buffer = await file.arrayBuffer();
            const workbook = window.XLSX.read(buffer, {
                type: 'array',
                cellDates: true,
                cellNF: true,
                cellStyles: true,
                cellText: true
            });
            const sheetName = workbook.SheetNames[0];

            if (!sheetName) {
                throw new Error('没有读取到工作表。');
            }

            const sheet = workbook.Sheets[sheetName];
            const ref = sheet['!ref'];

            if (!ref) {
                throw new Error('第一个工作表为空。');
            }

            const range = window.XLSX.utils.decode_range(ref);

            if (range.e.c < 2) {
                throw new Error('导入表格没有 C 列。');
            }

            const dataRows = [];

            for (let rowIndex = range.s.r + 1; rowIndex <= range.e.r; rowIndex += 1) {
                if (rowHasData(sheet, rowIndex, range, window.XLSX)) {
                    dataRows.push(rowIndex);
                }
            }

            if (!dataRows.length) {
                throw new Error('没有读取到可分类的数据行。');
            }

            setSourceInfo({
                workbook,
                sheet,
                sheetName,
                range,
                dataRows
            });
            setStatus({
                type: 'ok',
                text: `已读取：${file.name}\n工作表：${sheetName}`
            });
        } catch (error) {
            setSourceInfo(null);
            setStatus({ type: 'error', text: error.message || '读取 Excel 失败。' });
        }
    };

    const handleExport = () => {
        if (!sourceInfo || !window.XLSX) return;

        if (!kantoAreas.size || !kansaiAreas.size) {
            setStatus({ type: 'error', text: '关东和关西区域至少各填写一个。' });
            return;
        }

        const outputWorkbook = window.XLSX.utils.book_new();

        if (sourceInfo.workbook?.Props) {
            outputWorkbook.Props = {
                ...sourceInfo.workbook.Props,
                Title: `${baseFileName(fileName)}_关东关西分类`
            };
        }

        window.XLSX.utils.book_append_sheet(
            outputWorkbook,
            buildFilteredSheet(sourceInfo.sheet, sourceInfo.range, classification.kanto, window.XLSX),
            safeSheetName('关东')
        );
        window.XLSX.utils.book_append_sheet(
            outputWorkbook,
            buildFilteredSheet(sourceInfo.sheet, sourceInfo.range, classification.kansai, window.XLSX),
            safeSheetName('关西')
        );

        if (includeUnmatched) {
            window.XLSX.utils.book_append_sheet(
                outputWorkbook,
                buildFilteredSheet(sourceInfo.sheet, sourceInfo.range, classification.unmatched, window.XLSX),
                safeSheetName('未分类')
            );
        }

        window.XLSX.writeFile(outputWorkbook, `${baseFileName(fileName)}_关东关西分类.xlsx`, { cellStyles: true });
        setStatus({
            type: 'ok',
            text: `已导出：关东 ${classification.kanto.length} 行，关西 ${classification.kansai.length} 行，未分类 ${classification.unmatched.length} 行。`
        });
    };

    const canExport = Boolean(sourceInfo && xlsxReady && kantoAreas.size && kansaiAreas.size);
    const statusType = duplicateAreas.length ? 'warn' : status.type;
    const statusText = duplicateAreas.length ? `关东/关西重复区域：${duplicateAreas.join('、')}` : status.text;

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6">
            <div className="mx-auto max-w-6xl space-y-6">
                <section className="rounded-lg bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-950">关东 / 关西地址分表</h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                                导入 Excel 后按 C 列地址拆分为不同 sheet，导出时保留原始列和单元格内容。
                            </p>
                        </div>
                        <div className="rounded-md bg-slate-100 px-4 py-3 text-sm text-slate-600">
                            <div className="flex items-center gap-2 font-semibold text-slate-900">
                                <GearSix className="h-4 w-4" weight="bold" />
                                {xlsxReady ? '解析库 OK' : '加载中'}
                            </div>
                            <div className="mt-1">关东 / 关西 / 未分类</div>
                        </div>
                    </div>
                </section>

                <div className="grid gap-6 lg:grid-cols-3">
                    <Panel className="lg:col-span-1">
                        <div className="space-y-6">
                            <div>
                                <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-950">
                                    <UploadSimple className="h-5 w-5" weight="bold" />
                                    导入
                                </h2>
                                <label
                                    htmlFor="area-file"
                                    className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition ${
                                        fileName
                                            ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                                            : 'border-slate-300 bg-slate-50 text-slate-700 hover:border-slate-400 hover:bg-slate-100'
                                    }`}
                                >
                                    <FileXls className="h-10 w-10" weight="duotone" />
                                    <span className="mt-3 max-w-full truncate text-sm font-semibold">{fileName || '选择 .xlsx / .xls 文件'}</span>
                                    <span className="mt-1 text-xs text-slate-500">读取第一个工作表</span>
                                </label>
                                <input id="area-file" type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} disabled={!xlsxReady} />
                            </div>

                            <div>
                                <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-950">
                                    <Table className="h-5 w-5" weight="bold" />
                                    区域
                                </h2>
                                <div className="mt-4 grid gap-4">
                                    <label className="block">
                                        <span className="text-sm font-semibold text-slate-700">关东</span>
                                        <textarea
                                            value={kantoText}
                                            onChange={(event) => setKantoText(event.target.value)}
                                            className="mt-2 h-32 w-full resize-none rounded-md border border-slate-300 bg-white p-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="text-sm font-semibold text-slate-700">关西</span>
                                        <textarea
                                            value={kansaiText}
                                            onChange={(event) => setKansaiText(event.target.value)}
                                            className="mt-2 h-32 w-full resize-none rounded-md border border-slate-300 bg-white p-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                        />
                                    </label>
                                </div>
                                <label className="mt-4 flex items-center gap-3 rounded-lg bg-slate-50 p-4 text-sm font-medium text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={includeUnmatched}
                                        onChange={(event) => setIncludeUnmatched(event.target.checked)}
                                        className="h-4 w-4 rounded border-slate-300 text-slate-950"
                                    />
                                    导出未分类 sheet
                                </label>
                            </div>

                            <StatusBox status={{ type: statusType, text: statusText }} />
                        </div>
                    </Panel>

                    <Panel className="lg:col-span-2">
                        <div className="space-y-6">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-950">预览</h2>
                                    <p className="mt-1 text-sm text-slate-500">{sourceInfo ? `${sourceInfo.sheetName} / C 列` : '等待导入文件'}</p>
                                </div>
                                <span className="inline-flex h-8 max-w-full items-center rounded-md bg-slate-100 px-3 text-sm font-semibold text-slate-600">
                                    {fileName || 'No file'}
                                </span>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                <StatCard label="数据行" value={sourceInfo?.dataRows.length || 0} />
                                <StatCard label="关东" value={classification.kanto.length} accent="bg-cyan-50 text-cyan-900" />
                                <StatCard label="关西" value={classification.kansai.length} accent="bg-rose-50 text-rose-900" />
                                <StatCard label="未分类" value={classification.unmatched.length} accent="bg-amber-50 text-amber-900" />
                            </div>

                            <div className="flex justify-end">
                                <Button type="button" onClick={handleExport} disabled={!canExport || duplicateAreas.length > 0}>
                                    <DownloadSimple className="h-4 w-4" weight="bold" />
                                    导出 Excel
                                </Button>
                            </div>

                            <div className="overflow-x-auto rounded-lg border border-slate-200">
                                <table className="w-full min-w-[560px] text-left text-sm">
                                    <thead className="bg-slate-100 text-slate-600">
                                        <tr>
                                            <th className="w-24 p-3 font-semibold">行号</th>
                                            <th className="p-3 font-semibold">C 列地址</th>
                                            <th className="w-32 p-3 font-semibold">分类</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {classification.preview.length ? (
                                            classification.preview.map((row) => (
                                                <tr key={row.rowNumber} className="border-t border-slate-100">
                                                    <td className="p-3 text-slate-500">{row.rowNumber}</td>
                                                    <td className="p-3 font-medium text-slate-950">{row.address}</td>
                                                    <td className="p-3">{row.group}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={3} className="p-8 text-center text-slate-500">
                                                    暂无数据
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </Panel>
                </div>
            </div>
        </main>
    );
}
