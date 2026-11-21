'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createOcrWorker, OCR_COLUMNS, recognizeScreenshot } from './ocr.mjs';
import { dateKey, dateLabel, DEFAULT_AGENTS, DEFAULT_NY_KEYWORD, extractRows } from './rules.mjs';

const SETTINGS_KEY = 'work-tools:awb-settings-v1';
const INPUT = 'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-emerald-600 disabled:bg-slate-100';
const ACTION = 'inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-45';
const PRIMARY = 'min-h-10 rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-45';

export default function AwbTool() {
    const [files, setFiles] = useState([]);
    const [rows, setRows] = useState([]);
    const [date, setDate] = useState('');
    const [agents, setAgents] = useState(DEFAULT_AGENTS);
    const [keyword, setKeyword] = useState(DEFAULT_NY_KEYWORD);
    const [busy, setBusy] = useState(false);
    const [status, setStatus] = useState('');
    const [settingsStatus, setSettingsStatus] = useState('');
    const [copyStatus, setCopyStatus] = useState('');
    const [errors, setErrors] = useState([]);
    const [view, setView] = useState(null);
    const nextImageId = useRef(0);
    const previewUrls = useRef(new Set());
    const output = useRef(null);
    const dates = [...new Set(rows.map(row => dateKey(row.date)).filter(Boolean))].sort();
    const filterDate = dates.includes(date) ? date : (dates.length === 1 ? dates[0] : '');
    const { results, issues } = extractRows(rows, filterDate, agents, keyword);
    const text = results.map(row => [row.master, row.agent, row.pieces].join('\t')).join('\n');
    const issuesByRow = new Map(issues.map(issue => [issue.row.id, issue.reason]));
    const needsReview = new Set([...issuesByRow.keys(), ...results.filter(result => result.row.uncertain).map(result => result.row.id)]).size;

    useEffect(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY));
            if (typeof saved?.agents === 'string') setAgents(saved.agents);
            if (typeof saved?.keyword === 'string') setKeyword(saved.keyword);
        } catch {
            // Browser storage may be unavailable.
        }
        const urls = previewUrls.current;
        return () => urls.forEach(url => URL.revokeObjectURL(url));
    }, []);

    const resetResults = useCallback(() => {
        setRows([]);
        setDate('');
        setErrors([]);
        setStatus('');
        setCopyStatus('');
    }, []);

    const addFiles = useCallback(incoming => {
        const images = Array.from(incoming).filter(file => /^image\/(png|jpe?g|webp|bmp|gif)$/i.test(file.type));
        if (!images.length) {
            if (incoming.length) setErrors(['无法识别剪贴板中的图片格式。请重新截屏后粘贴。']);
            return;
        }
        const added = images.map(file => {
            const id = ++nextImageId.current;
            const url = URL.createObjectURL(file);
            previewUrls.current.add(url);
            return { id, url, file, label: file.name && file.name !== 'image.png' ? file.name : `截图 ${id}` };
        });
        resetResults();
        setFiles(previous => [...previous, ...added]);
    }, [resetResults]);

    useEffect(() => {
        function paste(event) {
            if (busy || !event.clipboardData) return;
            const images = Array.from(event.clipboardData.items)
                .filter(item => item.kind === 'file' && item.type.startsWith('image/'))
                .map(item => item.getAsFile()).filter(Boolean);
            if (!images.length) return;
            event.preventDefault();
            addFiles(images);
        }
        window.addEventListener('paste', paste);
        return () => window.removeEventListener('paste', paste);
    }, [addFiles, busy]);

    function removeFile(image) {
        URL.revokeObjectURL(image.url);
        previewUrls.current.delete(image.url);
        setFiles(previous => previous.filter(file => file.id !== image.id));
        if (view?.id === image.id) setView(null);
        resetResults();
    }

    function clearFiles() {
        previewUrls.current.forEach(url => URL.revokeObjectURL(url));
        previewUrls.current.clear();
        setFiles([]);
        setView(null);
        resetResults();
    }

    async function runRecognition() {
        if (!files.length || busy) return;
        resetResults();
        setBusy(true);
        setStatus('正在加载识别组件…');
        const workers = {};
        const recognized = [];
        const failed = [];
        try {
            workers.latin = await createOcrWorker('eng');
            workers.japanese = await createOcrWorker(['jpn', 'eng']);
            for (const [index, image] of files.entries()) {
                try {
                    const found = await recognizeScreenshot(image.file, workers, column => {
                        setStatus(`正在识别第 ${index + 1} / ${files.length} 张 · ${column}`);
                    });
                    if (!found.length) failed.push(`第 ${index + 1} 张没有识别到文字，请检查截图清晰度。`);
                    recognized.push(...found.map(row => ({ ...row, id: `${image.id}-${row.index}`, image: index + 1 })));
                } catch (error) {
                    failed.push(`第 ${index + 1} 张 · ${error.message || '无法读取图片。'}`);
                }
            }
            setRows(recognized);
            setStatus(recognized.length ? `识别到 ${recognized.length} 行，可按日期筛选并校对。` : '没有识别到可用记录。');
        } catch {
            failed.push('无法加载识别组件，请刷新页面后重试。');
            setStatus('');
        } finally {
            setErrors(failed);
            setBusy(false);
            await Promise.allSettled(Object.values(workers).map(worker => worker.terminate()));
        }
    }

    function saveSettings() {
        if (!agents.trim()) {
            setSettingsStatus('请至少填写一个代理。');
            return;
        }
        if (agents.split(/[,，、\n]/).some(agent => agent.trim().toUpperCase() === 'NY') && !keyword.trim()) {
            setSettingsStatus('启用 NY 时，请填写 H 列关键词。');
            return;
        }
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify({ agents, keyword }));
            setSettingsStatus('已保存到此浏览器。');
        } catch {
            setSettingsStatus('浏览器无法保存设置，本次修改仍可使用。');
        }
    }

    async function copyResults() {
        try {
            await navigator.clipboard.writeText(text);
            setCopyStatus('已复制三列结果。');
        } catch {
            output.current?.focus();
            output.current?.select();
            if (document.execCommand('copy')) setCopyStatus('已复制三列结果。');
            else setCopyStatus('结果已选中，请按 Ctrl+C 或 ⌘C 复制。');
        }
    }

    function editRow(id, field, value) {
        setRows(previous => previous.map(row => row.id === id ? { ...row, [field]: value } : row));
        setCopyStatus('');
    }

    return (
        <main className="mx-auto w-full max-w-7xl space-y-5 px-4 py-7 sm:px-6 sm:py-9">
            <header>
                <Link href="/" className="nav-link text-sm font-semibold text-emerald-800">工具总览</Link>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">截图提取主单号</h1>
                <p className="mt-2 text-base text-slate-600">粘贴多张表格截图，按日期和代理提取主单号。图片仅在此浏览器中处理。</p>
            </header>

            <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-xl font-bold">表格截图</h2>
                        <span className="text-sm font-medium text-slate-600">{files.length} 张</span>
                    </div>
                    <div
                        tabIndex={0}
                        aria-label="截图粘贴区"
                        className="flex min-h-34 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-emerald-300 bg-emerald-50/50 p-4 text-center focus-visible:outline-2 focus-visible:outline-emerald-600"
                    >
                        <p className="text-base font-semibold">按 <kbd className="rounded border border-emerald-200 bg-white px-1.5 py-0.5 font-mono text-sm">Ctrl+V</kbd> 粘贴截图</p>
                        <p className="text-sm text-slate-600">请截全 C 到 H 列，保留文字和黑色网格线。</p>
                    </div>
                    {!!files.length && (
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {files.map((image, index) => (
                                <div key={image.id} className="overflow-hidden rounded-md border border-slate-200">
                                    <button type="button" aria-label={`预览第 ${index + 1} 张`} onClick={() => setView(image)} className="block h-16 w-full cursor-zoom-in bg-slate-100">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={image.url} alt="" className="h-full w-full object-contain" />
                                    </button>
                                    <div className="flex items-center justify-between gap-1 px-2 py-1">
                                        <span title={image.label} className="truncate text-xs font-medium text-slate-700">图 {index + 1} · {image.label}</span>
                                        <button className="text-xs font-semibold text-slate-600 hover:text-red-700 disabled:opacity-45" type="button" disabled={busy} onClick={() => removeFile(image)}>移除</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                        <button type="button" className={PRIMARY} onClick={runRecognition} disabled={!files.length || busy}>{busy ? '识别中…' : '识别截图'}</button>
                        {!!files.length && <button type="button" className={ACTION} onClick={clearFiles} disabled={busy}>清空</button>}
                    </div>
                    {status && <p className="text-sm text-slate-600" role="status">{status}</p>}
                    {!!errors.length && <ul role="alert" className="space-y-1 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">{errors.map((error, index) => <li key={index}>{error}</li>)}</ul>}
                </section>

                <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-xl font-bold">提取结果</h2>
                        <span className="text-sm font-medium text-slate-600">{results.length} 条</span>
                    </div>
                    <label className="block space-y-1 text-sm font-semibold">
                        <span>C 列日期</span>
                        <select className={INPUT} disabled={!dates.length || busy} value={filterDate} onChange={event => { setDate(event.target.value); setCopyStatus(''); }}>
                            <option value="">{dates.length ? '全部日期' : '识别后可选择'}</option>
                            {dates.map(key => <option key={key} value={key}>{dateLabel(key)}</option>)}
                        </select>
                    </label>
                    <div>
                        <label htmlFor="awb-output" className="mb-1 block text-sm font-semibold">主单号 · 代理 · 件数 / SF</label>
                        <textarea id="awb-output" ref={output} readOnly rows={7} spellCheck={false} wrap="off" className={`${INPUT} font-mono leading-relaxed [tab-size:4]`} value={text} placeholder={rows.length ? '当前条件下没有结果' : '识别完成后显示结果'} />
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                            <button className={PRIMARY} type="button" disabled={!text} onClick={copyResults}>复制结果</button>
                            {copyStatus && <span role="status" className="text-sm text-emerald-800">{copyStatus}</span>}
                        </div>
                    </div>
                    <details className="border-t border-slate-200 pt-3">
                        <summary className="cursor-pointer text-sm font-semibold">代理设置</summary>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <label className="space-y-1 text-sm font-semibold">
                                <span>F 列代理名单</span>
                                <textarea className={INPUT} rows={5} value={agents} spellCheck={false} onChange={event => { setAgents(event.target.value); setSettingsStatus(''); setCopyStatus(''); }} />
                                <span className="block font-normal text-slate-600">每行一个代理，也可用逗号分隔。</span>
                            </label>
                            <label className="space-y-1 text-sm font-semibold">
                                <span>NY 的 H 列关键词</span>
                                <input className={INPUT} value={keyword} onChange={event => { setKeyword(event.target.value); setSettingsStatus(''); setCopyStatus(''); }} />
                                <span className="block font-normal text-slate-600">H 列包含关键词才提取 NY。</span>
                            </label>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                            <button className={ACTION} type="button" onClick={saveSettings}>保存设置</button>
                            {settingsStatus && <span role="status" className="text-sm text-slate-600">{settingsStatus}</span>}
                        </div>
                    </details>
                </section>
            </div>

            {!!rows.length && (
                <details className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <summary className="cursor-pointer text-base font-semibold">
                        校对识别结果
                        {!!needsReview && <span className="ml-2 rounded-md bg-amber-50 px-2 py-0.5 text-sm text-amber-900">{needsReview} 行待核对</span>}
                    </summary>
                    <p className="mb-3 mt-2 text-sm text-slate-600">可直接改错字或错号，右侧提取结果会随之更新。复制前请核对主单号。</p>
                    <div className="overflow-auto">
                        <table className="w-full min-w-175 border-collapse text-left text-sm">
                            <thead><tr className="bg-slate-50 text-slate-700">
                                <th scope="col" className="px-2 py-2">截图</th>
                                {OCR_COLUMNS.map((column, index) => <th scope="col" key={column.key} className="px-2 py-2">{'CEFGH'[index]} · {column.name}</th>)}
                                <th scope="col" className="px-2 py-2">核对</th>
                            </tr></thead>
                            <tbody>
                                {rows.map(row => (
                                    <tr key={row.id} className="border-t border-slate-100">
                                        <td className="whitespace-nowrap px-2 py-1.5">图 {row.image} · 行 {row.index + 1}</td>
                                        {OCR_COLUMNS.map(column => (
                                            <td key={column.key} className="px-1 py-1.5">
                                                <input className={`${INPUT} min-w-20 ${column.key === 'master' ? 'min-w-36 font-mono' : ''}`} aria-label={`图 ${row.image} 行 ${row.index + 1} ${column.name}`} value={row[column.key] || ''} onChange={event => editRow(row.id, column.key, event.target.value)} />
                                            </td>
                                        ))}
                                        <td className="min-w-32 px-2 py-1.5 text-amber-900">{issuesByRow.get(row.id) || (row.uncertain ? '请核对截图' : '')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </details>
            )}

            {view && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4" role="dialog" aria-modal="true" aria-label="截图预览" onClick={() => setView(null)}>
                    <div className="flex max-h-full w-full max-w-6xl flex-col gap-3 rounded-lg bg-white p-3" onClick={event => event.stopPropagation()}>
                        <div className="flex items-center justify-between gap-3">
                            <span className="truncate text-sm font-semibold">{view.label}</span>
                            <button type="button" className={ACTION} autoFocus onKeyDown={event => { if (event.key === 'Escape') setView(null); }} onClick={() => setView(null)}>关闭预览</button>
                        </div>
                        <div className="overflow-auto">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={view.url} alt={view.label} className="max-w-none" />
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
