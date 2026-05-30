'use client';

import { useEffect, useMemo, useState } from 'react';

const XLSX_SCRIPT_ID = 'sheetjs-xlsx';
const XLSX_SCRIPT_SRC = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';

const PREFECTURE_ORDER = [
    ['沖縄', '沖縄県'],
    ['関東', '東京都'],
    ['関東', '神奈川県'],
    ['関東', '埼玉県'],
    ['関東', '千葉県'],
    ['関東', '茨城県'],
    ['関東', '群馬県'],
    ['関東', '栃木県'],
    ['近畿', '兵庫県'],
    ['近畿', '大阪府'],
    ['近畿', '和歌山県'],
    ['近畿', '奈良県'],
    ['近畿', '滋賀県'],
    ['近畿', '三重県'],
    ['近畿', '京都府'],
    ['九州', '長崎県'],
    ['九州', '福岡県'],
    ['九州', '大分県'],
    ['九州', '鹿児島県'],
    ['九州', '熊本県'],
    ['九州', '佐賀県'],
    ['九州', '宮崎県'],
    ['四国', '愛媛県'],
    ['四国', '高知県'],
    ['四国', '香川県'],
    ['四国', '徳島県'],
    ['中国', '岡山県'],
    ['中国', '山口県'],
    ['中国', '広島県'],
    ['中国', '島根県'],
    ['中国', '鳥取県'],
    ['中部', '愛知県'],
    ['中部', '富山県'],
    ['中部', '静岡県'],
    ['中部', '福井県'],
    ['中部', '石川県'],
    ['中部', '岐阜県'],
    ['中部', '新潟県'],
    ['中部', '長野県'],
    ['中部', '山梨県'],
    ['東北', '秋田県'],
    ['東北', '岩手県'],
    ['東北', '青森県'],
    ['東北', '宮城県'],
    ['東北', '山形県'],
    ['東北', '福島県'],
    ['北海道', '北海道']
];

const statusStyles = {
    idle: 'border-indigo-200 bg-indigo-50 text-indigo-800',
    loading: 'border-sky-200 bg-sky-50 text-sky-800',
    ok: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    error: 'border-rose-200 bg-rose-50 text-rose-800'
};

const iconPaths = {
    upload: 'M12 16V4m0 0 4 4m-4-4-4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2',
    download: 'M12 4v12m0 0 4-4m-4 4-4-4M4 18v2h16v-2',
    file: 'M14 3v5h5M7 3h7l5 5v13H7V3z',
    check: 'M20 6 9 17l-5-5',
    alert: 'M12 9v4m0 4h.01M10.3 4.5 2.8 17.5A2 2 0 0 0 4.5 20h15a2 2 0 0 0 1.7-3L13.7 4.5a2 2 0 0 0-3.4 0z'
};

function Icon({ name, className = 'h-5 w-5' }) {
    return (
        <svg
            className={className}
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path d={iconPaths[name]} />
        </svg>
    );
}

function Button({ children, className = '', ...props }) {
    return (
        <button
            {...props}
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 ${className}`}
        >
            {children}
        </button>
    );
}

function Panel({ children, className = '' }) {
    return <section className={`rounded-lg border border-slate-200 bg-white p-6 shadow-sm ${className}`}>{children}</section>;
}

function normalizeText(value) {
    return String(value ?? '')
        .trim()
        .replace(/\u3000/g, ' ')
        .replace(/\s+/g, ' ');
}

function normalizeHeader(value) {
    return normalizeText(value).replace(/^\uFEFF/, '').toLowerCase();
}

function toNumber(value) {
    if (typeof value === 'number') return value;

    const numericValue = Number(String(value ?? '').replace(/,/g, ''));
    return Number.isFinite(numericValue) ? numericValue : 0;
}

function monthName(value) {
    const text = normalizeText(value);
    const match = text.match(/(\d{1,2})\s*月/);

    return match ? `${Number(match[1])}月` : text || '集計';
}

function safeSheetName(name) {
    return name.replace(/[\\/?*[\]:]/g, '_').slice(0, 31) || '集計';
}

function borderAll() {
    return {
        top: { style: 'thin', color: { rgb: 'D9D9D9' } },
        bottom: { style: 'thin', color: { rgb: 'D9D9D9' } },
        left: { style: 'thin', color: { rgb: 'D9D9D9' } },
        right: { style: 'thin', color: { rgb: 'D9D9D9' } }
    };
}

function headerMatches(row, rule) {
    const headers = row.map(normalizeHeader);

    return rule.every((group) => group.some((name) => headers.includes(normalizeHeader(name))));
}

function matrixToObjects(matrix, headerRule) {
    let headerIndex = 0;

    if (headerRule?.length) {
        headerIndex = matrix.findIndex((row) => headerMatches(row, headerRule));

        if (headerIndex < 0) {
            const sample = matrix
                .slice(0, 8)
                .map((row, index) => `${index + 1}行目: ${row.map(normalizeText).filter(Boolean).join(' / ')}`)
                .join('\n');

            throw new Error(`没有找到需要的表头行。前几行内容：\n${sample}`);
        }
    }

    const headers = matrix[headerIndex].map((header, index) => normalizeText(header) || `__EMPTY_${index}`);
    const rows = [];

    for (let rowIndex = headerIndex + 1; rowIndex < matrix.length; rowIndex += 1) {
        const row = matrix[rowIndex];

        if (!row || row.every((value) => normalizeText(value) === '')) continue;

        const rowObject = {};
        headers.forEach((header, index) => {
            rowObject[header] = row[index] ?? '';
        });
        rows.push(rowObject);
    }

    return rows;
}

async function readWorkbookFile(file, headerRule, xlsx) {
    const data = await file.arrayBuffer();
    const workbook = xlsx.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    if (!sheet) {
        throw new Error(`${file.name} 没有可读取的工作表。`);
    }

    const matrix = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true });
    return matrixToObjects(matrix, headerRule);
}

function pick(row, names) {
    for (const name of names) {
        const value = row[name];

        if (value !== undefined && value !== null && normalizeText(value) !== '') {
            return value;
        }
    }

    return '';
}

function buildDetailStats(rows) {
    const stats = new Map();

    for (const row of rows) {
        const prefecture = normalizeText(pick(row, ['local_province', 'Local_province', '都道府県']));
        const city = normalizeText(pick(row, ['local_city', 'Local_city', '扱店市区町村', 'city']));

        if (!prefecture || !city) continue;

        const key = `${prefecture}||${city}`;
        stats.set(key, (stats.get(key) || 0) + 1);
    }

    const byPrefecture = new Map();

    for (const [key, count] of stats.entries()) {
        const [prefecture, city] = key.split('||');

        if (!byPrefecture.has(prefecture)) {
            byPrefecture.set(prefecture, []);
        }

        byPrefecture.get(prefecture).push({ prefecture, city, count });
    }

    for (const rowsForPrefecture of byPrefecture.values()) {
        rowsForPrefecture.sort((a, b) => b.count - a.count || a.city.localeCompare(b.city, 'ja'));
    }

    return byPrefecture;
}

function buildSummaryByMonth(rows) {
    const months = new Map();

    for (const row of rows) {
        const rawMonth = pick(row, ['create_time', 'Create_time', '作成月', '月']);
        const prefecture = normalizeText(pick(row, ['local_province', 'Local_province', '都道府県']));
        const count = toNumber(
            pick(row, ['配送订单数', '配送訂單數', '配送注文数', '件数', '個数', 'count', 'Count'])
        );

        if (!prefecture) continue;

        const month = monthName(rawMonth);

        if (!months.has(month)) {
            months.set(month, new Map());
        }

        months.get(month).set(prefecture, (months.get(month).get(prefecture) || 0) + count);
    }

    return months;
}

function makeSheetRows(month, prefectureCounts, cityByPrefecture, useSummaryDenominator) {
    const total = [...prefectureCounts.values()].reduce((sum, count) => sum + count, 0);
    const rows = [];

    rows[0] = ['CAINIAO貨物', `${month}集計:`, total, '', '', '', '', '', '', '', ''];
    rows[1] = ['', '', '', '', '', '', '', '', '', '', ''];
    rows[2] = [
        '',
        '都道府県',
        '件数',
        '全国割合',
        '',
        'エリア',
        '都道府県',
        '扱店市区町村',
        '個数',
        '同県内割合',
        '県内順位'
    ];
    rows[3] = ['総計', '', '', '', '', '', '', '', '', '', ''];

    let leftRow = 4;

    for (const [area, prefecture] of PREFECTURE_ORDER) {
        const count = prefectureCounts.get(prefecture) || 0;

        rows[leftRow] = rows[leftRow] || Array(11).fill('');
        rows[leftRow][0] = area;
        rows[leftRow][1] = prefecture;
        rows[leftRow][2] = count;
        rows[leftRow][3] = total ? count / total : 0;
        leftRow += 1;
    }

    let rightRow = 3;

    for (const [area, prefecture] of PREFECTURE_ORDER) {
        const cityRows = cityByPrefecture.get(prefecture) || [];
        const denominator = useSummaryDenominator
            ? prefectureCounts.get(prefecture) || 0
            : cityRows.reduce((sum, item) => sum + item.count, 0);

        cityRows.forEach((item, index) => {
            rows[rightRow] = rows[rightRow] || Array(11).fill('');
            rows[rightRow][5] = area;
            rows[rightRow][6] = prefecture;
            rows[rightRow][7] = item.city;
            rows[rightRow][8] = item.count;
            rows[rightRow][9] = denominator ? item.count / denominator : 0;
            rows[rightRow][10] = index + 1;
            rightRow += 1;
        });
    }

    return rows.map((row) => {
        const normalizedRow = Array(11).fill('');
        row.forEach((value, index) => {
            normalizedRow[index] = value;
        });
        return normalizedRow;
    });
}

function styleWorkbook(workbook, xlsx) {
    for (const name of workbook.SheetNames) {
        const sheet = workbook.Sheets[name];
        const range = xlsx.utils.decode_range(sheet['!ref']);

        sheet['!cols'] = [
            { wch: 10 },
            { wch: 12 },
            { wch: 12 },
            { wch: 12 },
            { wch: 3 },
            { wch: 10 },
            { wch: 12 },
            { wch: 18 },
            { wch: 10 },
            { wch: 13 },
            { wch: 10 }
        ];
        sheet['!rows'] = Array(range.e.r + 1)
            .fill(null)
            .map((_, index) => ({ hpt: index === 0 ? 22 : 18 }));

        for (let row = range.s.r; row <= range.e.r; row += 1) {
            for (let column = range.s.c; column <= range.e.c; column += 1) {
                const address = xlsx.utils.encode_cell({ r: row, c: column });

                if (!sheet[address]) continue;

                sheet[address].s = sheet[address].s || {};
                sheet[address].s.alignment = { vertical: 'center' };

                if (row === 2) {
                    sheet[address].s = {
                        font: { bold: true },
                        fill: { fgColor: { rgb: 'D9EAD3' } },
                        alignment: { horizontal: 'center', vertical: 'center' },
                        border: borderAll()
                    };
                }

                if (row >= 3 && column <= 10) {
                    sheet[address].s.border = borderAll();
                }

                if (column === 3 || column === 9) {
                    sheet[address].z = '0.00%';
                }

                if (column === 2 || column === 8 || column === 10) {
                    sheet[address].z = '#,##0';
                }
            }
        }
    }
}

function getPreview(months, cityByPrefecture) {
    const firstMonth = months.keys().next().value;

    if (!firstMonth) {
        return null;
    }

    const prefectureCounts = months.get(firstMonth);
    const topPrefectures = [...prefectureCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([prefecture, count]) => ({ prefecture, count }));

    return {
        firstMonth,
        prefectureCount: prefectureCounts.size,
        cityPrefectureCount: cityByPrefecture.size,
        topPrefectures
    };
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

function FileDrop({ id, step, title, hint, file, accept, onChange }) {
    return (
        <div>
            <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-slate-950">{title}</h3>
                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{step}</span>
            </div>

            <label
                htmlFor={id}
                className={`mt-3 flex h-14 cursor-pointer items-center gap-3 rounded-lg border px-3 transition ${
                    file
                        ? 'border-teal-300 bg-teal-50 text-teal-900'
                        : 'border-dashed border-slate-300 bg-slate-50 text-slate-800 hover:border-teal-400 hover:bg-teal-50'
                }`}
            >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-slate-600 shadow-sm">
                    <Icon name={file ? 'check' : 'upload'} className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-800">{file?.name || '选择文件'}</span>
                    <span className="block truncate text-xs text-slate-500">{accept.replaceAll(',', ' / ')}</span>
                </span>
            </label>
            <input id={id} type="file" accept={accept} className="hidden" onChange={onChange} />

            <p className="mt-2 text-xs leading-5 text-slate-500">{hint}</p>
        </div>
    );
}

export default function CainiaoDatePage() {
    const [detailFile, setDetailFile] = useState(null);
    const [summaryFile, setSummaryFile] = useState(null);
    const [useSummaryDenominator, setUseSummaryDenominator] = useState(true);
    const [xlsxReady, setXlsxReady] = useState(false);
    const [status, setStatus] = useState({
        type: 'idle',
        text: '请选择两个文件后点击生成。'
    });
    const [preview, setPreview] = useState(null);

    useEffect(() => {
        ensureXlsxLoaded(
            () => {
                setXlsxReady(true);
                setStatus((current) =>
                    current.type === 'loading' ? { type: 'idle', text: '请选择两个文件后点击生成。' } : current
                );
            },
            () => {
                setStatus({
                    type: 'error',
                    text: 'Excel 解析库加载失败，请检查网络后刷新页面。'
                });
            }
        );
    }, []);

    const selectedFileCount = [detailFile, summaryFile].filter(Boolean).length;
    const canGenerate = useMemo(() => Boolean(detailFile && summaryFile && xlsxReady), [detailFile, summaryFile, xlsxReady]);

    const handleGenerate = async () => {
        try {
            if (!window.XLSX) {
                throw new Error('Excel 解析库还没有加载完成，请稍候再试。');
            }

            if (!detailFile || !summaryFile) {
                throw new Error('请先选择表1和表2两个文件。');
            }

            setPreview(null);
            setStatus({ type: 'loading', text: '正在读取文件并统计，请稍候...' });

            const [detailRows, summaryRows] = await Promise.all([
                readWorkbookFile(
                    detailFile,
                    [
                        ['local_province', '都道府県'],
                        ['local_city', '扱店市区町村', 'city']
                    ],
                    window.XLSX
                ),
                readWorkbookFile(
                    summaryFile,
                    [
                        ['create_time', '作成月', '月'],
                        ['local_province', '都道府県'],
                        ['配送订单数', '配送訂單數', '配送注文数', '件数', '個数', 'count']
                    ],
                    window.XLSX
                )
            ]);

            if (!detailRows.length) {
                throw new Error('表1没有读取到数据。');
            }

            if (!summaryRows.length) {
                throw new Error('表2没有读取到数据。');
            }

            const cityByPrefecture = buildDetailStats(detailRows);
            const months = buildSummaryByMonth(summaryRows);

            if (!months.size) {
                throw new Error('表2没有识别到有效数据。请确认表头包含 create_time / local_province / 配送订单数。');
            }

            const workbook = window.XLSX.utils.book_new();

            for (const [month, prefectureCounts] of months.entries()) {
                const rows = makeSheetRows(month, prefectureCounts, cityByPrefecture, useSummaryDenominator);
                const worksheet = window.XLSX.utils.aoa_to_sheet(rows);
                window.XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName(month));
            }

            styleWorkbook(workbook, window.XLSX);
            window.XLSX.writeFile(workbook, '個数データ_生成.xlsx', { cellStyles: true });

            const nextPreview = getPreview(months, cityByPrefecture);
            setPreview(nextPreview);
            setStatus({
                type: 'ok',
                text: `生成完成。\n已生成 ${months.size} 个 sheet：${[...months.keys()].join('、')}。`
            });
        } catch (error) {
            console.error(error);
            setStatus({ type: 'error', text: error.message || String(error) });
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6">
            <div className="mx-auto max-w-6xl space-y-6">
                <section className="rounded-lg bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-950">CAINIAO 个数数据生成工具</h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                                上传表1明细和表2月别汇总，生成「個数データ_生成.xlsx」。
                            </p>
                        </div>
                        <div className="rounded-md bg-slate-100 px-4 py-3 text-sm text-slate-600">
                            <div className="font-semibold text-slate-900">输出内容</div>
                            <div className="mt-1">都道府県 / 城市個数 / 県内順位</div>
                        </div>
                    </div>
                </section>

                <div className="grid gap-6 lg:grid-cols-3">
                    <Panel className="lg:col-span-1">
                        <div className="space-y-6">
                            <div>
                                <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-950">
                                    <Icon name="upload" /> 上传文件
                                </h2>
                                <div className="mt-4 space-y-4">
                                    <FileDrop
                                        id="detailFile"
                                        step="表1"
                                        title="明细 CSV / Excel"
                                        hint="需要 local_province、tracking_number、local_city。"
                                        file={detailFile}
                                        accept=".csv,.xlsx,.xls"
                                        onChange={(event) => setDetailFile(event.target.files?.[0] || null)}
                                    />
                                    <FileDrop
                                        id="summaryFile"
                                        step="表2"
                                        title="月别汇总 Excel"
                                        hint="需要 create_time、local_province、配送订单数。"
                                        file={summaryFile}
                                        accept=".xlsx,.xls,.csv"
                                        onChange={(event) => setSummaryFile(event.target.files?.[0] || null)}
                                    />
                                </div>
                            </div>

                            <div>
                                <h2 className="text-xl font-semibold text-slate-950">生成设置</h2>
                                <label className="mt-3 flex items-start gap-3 rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={useSummaryDenominator}
                                        onChange={(event) => setUseSummaryDenominator(event.target.checked)}
                                        className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-600"
                                    />
                                    <span>城市「同県内割合」使用表2都道府県件数做分母</span>
                                </label>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-lg bg-slate-100 p-4">
                                    <div className="text-sm text-slate-500">文件</div>
                                    <div className="mt-1 text-2xl font-bold text-slate-950">{selectedFileCount}/2</div>
                                </div>
                                <div className="rounded-lg bg-slate-100 p-4">
                                    <div className="text-sm text-slate-500">解析库</div>
                                    <div className="mt-1 text-2xl font-bold text-slate-950">{xlsxReady ? 'OK' : '...'}</div>
                                </div>
                            </div>

                            <Button type="button" onClick={handleGenerate} disabled={!canGenerate} className="w-full">
                                <Icon name="download" className="h-4 w-4" />
                                生成表3 Excel
                            </Button>

                            <div className={`rounded-md border px-4 py-3 text-sm leading-6 ${statusStyles[status.type] || statusStyles.idle}`}>
                                <div className="flex gap-2 whitespace-pre-line">
                                    <Icon
                                        name={status.type === 'error' ? 'alert' : status.type === 'ok' ? 'check' : 'file'}
                                        className="mt-0.5 h-4 w-4 shrink-0"
                                    />
                                    <span>{status.text}</span>
                                </div>
                            </div>
                        </div>
                    </Panel>

                    <Panel className="lg:col-span-2">
                        <div className="space-y-6">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-950">生成预览</h2>
                                    <p className="mt-1 text-sm text-slate-500">生成后显示第一个月份的汇总结果。</p>
                                </div>
                                {preview && (
                                    <span className="inline-flex h-8 items-center rounded-md bg-emerald-50 px-3 text-sm font-bold text-emerald-700">
                                        {preview.firstMonth}
                                    </span>
                                )}
                            </div>

                            {preview ? (
                                <>
                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div className="rounded-lg bg-slate-100 p-4">
                                            <div className="text-sm text-slate-500">预览月份</div>
                                            <div className="mt-1 text-2xl font-bold text-slate-950">{preview.firstMonth}</div>
                                        </div>
                                        <div className="rounded-lg bg-slate-100 p-4">
                                            <div className="text-sm text-slate-500">都道府県数</div>
                                            <div className="mt-1 text-2xl font-bold text-slate-950">{preview.prefectureCount}</div>
                                        </div>
                                        <div className="rounded-lg bg-slate-100 p-4">
                                            <div className="text-sm text-slate-500">城市明细県数</div>
                                            <div className="mt-1 text-2xl font-bold text-slate-950">{preview.cityPrefectureCount}</div>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                                        <table className="w-full min-w-[520px] text-left text-sm">
                                            <thead className="bg-slate-100 text-slate-600">
                                                <tr>
                                                    <th className="p-3 font-semibold">順位</th>
                                                    <th className="p-3 font-semibold">都道府県</th>
                                                    <th className="p-3 font-semibold">件数</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {preview.topPrefectures.map((item, index) => (
                                                    <tr key={item.prefecture} className="border-t border-slate-100">
                                                        <td className="p-3 text-slate-500">{index + 1}</td>
                                                        <td className="p-3 font-semibold text-slate-950">{item.prefecture}</td>
                                                        <td className="p-3">{item.count.toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            ) : (
                                <div className="overflow-hidden rounded-lg border border-slate-200">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-100 text-slate-600">
                                            <tr>
                                                <th className="p-3 font-semibold">步骤</th>
                                                <th className="p-3 font-semibold">状态</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-t border-slate-100">
                                                <td className="p-3 font-semibold">表1</td>
                                                <td className="p-3 text-slate-500">{detailFile ? '已选择' : '等待上传'}</td>
                                            </tr>
                                            <tr className="border-t border-slate-100">
                                                <td className="p-3 font-semibold">表2</td>
                                                <td className="p-3 text-slate-500">{summaryFile ? '已选择' : '等待上传'}</td>
                                            </tr>
                                            <tr className="border-t border-slate-100">
                                                <td className="p-3 font-semibold">输出</td>
                                                <td className="p-3 text-slate-500">点击生成后下载 Excel</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </Panel>
                </div>
            </div>
        </main>
    );
}
