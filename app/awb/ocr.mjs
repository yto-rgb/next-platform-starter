import { detectCells, makeStrip, readStripWords } from './grid.mjs';
import { dateKey, hasSfMarker, masterNumber, numbersInNote, passesAwbCheck } from './rules.mjs';

export const OCR_COLUMNS = [
    { key: 'date', whitelist: '0123456789/-.', name: '日期' },
    { key: 'master', whitelist: '0123456789-', name: '主单号' },
    { key: 'agent', whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_/&', name: '代理' },
    { key: 'pieces', whitelist: '0123456789,', name: '件数' },
    { key: 'note', whitelist: '', name: '备注' },
];

export async function createOcrWorker(languages) {
    const { createWorker } = await import('tesseract.js');
    return new Promise((resolve, reject) => {
        createWorker(languages, 1, {
            workerPath: '/ocr-assets/worker.min.js',
            corePath: '/ocr-assets',
            langPath: '/ocr-assets',
            cachePath: 'work-tools-ocr-v6',
            errorHandler: reject,
        }).then(resolve, reject);
    });
}

async function readImage(file) {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, Math.sqrt(16000000 / (bitmap.width * bitmap.height)));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d', { willReadFrequently: true });
    try {
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        return context.getImageData(0, 0, canvas.width, canvas.height);
    } finally {
        bitmap.close();
    }
}

function canvasFor(strip) {
    const canvas = document.createElement('canvas');
    canvas.width = strip.width;
    canvas.height = strip.height;
    canvas.getContext('2d').putImageData(new ImageData(strip.data, strip.width, strip.height), 0, 0);
    return canvas;
}

export async function recognizeGrid(image, { latin, japanese }, encode, onColumn = () => {}) {
    const cells = detectCells(image);
    const rows = cells.map((_, index) => ({ index, uncertain: false }));

    for (const [columnIndex, column] of OCR_COLUMNS.entries()) {
        onColumn(column.name);
        const worker = column.key === 'note' ? japanese : latin;
        for (let start = 0; start < cells.length; start += 45) {
            const selected = cells.slice(start, start + 45).map(row => row[columnIndex]);
            const strip = makeStrip(image, selected, 4);
            if (!strip.populated.some(Boolean)) continue;
            const { data } = await worker.recognize(await encode(strip), {
                tessedit_pageseg_mode: '6',
                tessedit_char_whitelist: column.whitelist,
                user_defined_dpi: '300',
            }, { blocks: true, text: false });
            const recognized = readStripWords(data.blocks, strip.pitch, selected.length);
            recognized.forEach(({ text, confidence }, index) => {
                const row = rows[start + index];
                row[column.key] = text;
                if (strip.populated[index] && (!text || confidence < 68) && ['date', 'agent', 'pieces'].includes(column.key)) row.uncertain = true;
            });
        }
    }

    const visibleRows = rows.filter(row => row.date || row.agent || row.master || row.note);
    onColumn('核验主单号');
    for (const row of visibleRows) {
        if (!row.agent) continue;
        if (!dateKey(row.date)) {
            const retry = await rereadCell(image, cells[row.index][0], latin, encode, OCR_COLUMNS[0].whitelist, '7', 3);
            if (dateKey(retry)) row.date = retry.trim();
            else if (/^\d{2}1\d{2}$/.test(row.date)) {
                const candidate = `${row.date.slice(0, 2)}/${row.date.slice(-2)}`;
                if (dateKey(candidate)) row.date = candidate;
            }
            row.uncertain = true;
        }
        if (hasSfMarker(row.note)) {
            const numbers = numbersInNote(row.note);
            if (numbers.length === 1 && passesAwbCheck(numbers[0])) continue;
            if (numbers.length <= 1) {
                const noteCell = cells[row.index][4];
                const alternate = await retryNumber(image, noteCell, latin, encode, '6');
                const bottomStart = Math.floor(noteCell.height * 0.43);
                const lowerLine = { ...noteCell, y: noteCell.y + bottomStart, height: noteCell.height - bottomStart };
                let verified = numbersInNote(alternate).filter(passesAwbCheck);
                if (!verified.length && noteCell.height >= 20) {
                    const lowerText = await retryNumber(image, lowerLine, latin, encode, '7');
                    verified = numbersInNote(lowerText).filter(passesAwbCheck);
                }
                if (verified.length === 1) {
                    const original = numbers[0]?.split('').join('[\\s‐‑–—-]*');
                    row.note = original ? row.note.replace(new RegExp(original), verified[0]) : `${row.note} ${verified[0]}`;
                    continue;
                }
            }
            row.uncertain = true;
        } else if (!passesAwbCheck(masterNumber(row.master))) {
            const alternate = masterNumber(await retryNumber(image, cells[row.index][1], latin, encode, '7'));
            if (passesAwbCheck(alternate)) row.master = alternate;
            else row.uncertain = true;
        }
    }
    return visibleRows;
}

async function rereadCell(image, cell, worker, encode, whitelist, mode, scale, minWidth = 0) {
    const strip = makeStrip(image, [cell], scale);
    if (!strip.populated[0] || strip.width < minWidth) return '';
    const { data } = await worker.recognize(await encode(strip), {
        tessedit_pageseg_mode: mode,
        tessedit_char_whitelist: whitelist,
        user_defined_dpi: '300',
    });
    return data.text;
}

function retryNumber(image, cell, worker, encode, mode) {
    return rereadCell(image, cell, worker, encode, '0123456789-', mode, 3, 85);
}

export async function recognizeScreenshot(file, workers, onColumn) {
    return recognizeGrid(await readImage(file), workers, canvasFor, onColumn);
}
