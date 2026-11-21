const COLUMN_WIDTHS = [42, 111, 97, 44, 37, 180];
const EXTRACT_COLUMNS = [0, 2, 3, 4, 5];

function gridLines({ data, width, height }, vertical, from, to, minimum) {
    const extent = vertical ? width : height;
    const lines = [];
    for (let line = 0; line < extent; line++) {
        let votes = 0;
        for (let position = from; position < to; position++) {
            const offset = (vertical ? position * width + line : line * width + position) * 4;
            if (data[offset] < 100 && data[offset + 1] < 100 && data[offset + 2] < 100 && data[offset + 3] > 180) {
                votes++;
            }
        }
        if (votes < (to - from) * minimum) continue;
        const last = lines[lines.length - 1];
        if (last && line - last.end <= 2) last.end = line;
        else lines.push({ start: line, end: line });
    }
    return lines;
}

function includeEdge(lines, size) {
    if (!lines.length) return lines;
    if (lines[0].start >= 13) lines.unshift({ start: -1, end: -1 });
    if (size - lines[lines.length - 1].end >= 14) lines.push({ start: size, end: size });
    return lines;
}

export function detectCells(image) {
    const rows = includeEdge(gridLines(image, false, 0, image.width, 0.58), image.height);
    const top = Math.max(0, rows[0]?.start ?? 0);
    const bottom = Math.min(image.height, rows.at(-1)?.end ?? image.height);
    const columns = includeEdge(gridLines(image, true, top, bottom, 0.73), image.width);

    let best = { error: Infinity, lines: [] };
    for (let start = 0; start + COLUMN_WIDTHS.length < columns.length; start++) {
        const candidate = columns.slice(start, start + COLUMN_WIDTHS.length + 1);
        const ratios = COLUMN_WIDTHS.map((expected, index) => Math.log((candidate[index + 1].start - candidate[index].start) / expected));
        const mean = ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length;
        const error = Math.sqrt(ratios.reduce((sum, ratio) => sum + (ratio - mean) ** 2, 0) / ratios.length);
        if (error < best.error) best = { error, lines: candidate };
    }
    if (best.error > 0.19 || rows.length < 2) {
        throw new Error('找不到 C 到 H 列的表格线。请截全这六列，并保留黑色网格线。');
    }

    const result = [];
    for (let index = 1; index < rows.length; index++) {
        const y = rows[index - 1].end + 2;
        const height = rows[index].start - y - 1;
        if (height < 7) continue;
        const cells = EXTRACT_COLUMNS.map(column => {
            const x = best.lines[column].end + 2;
            const width = best.lines[column + 1].start - x - 1;
            return { x, y, width, height };
        });
        result.push(cells);
    }
    return result;
}

function cellInk(image, cell) {
    const ink = new Uint8Array(cell.width * cell.height).fill(255);
    let left = cell.width;
    let right = -1;
    let top = cell.height;
    let bottom = -1;
    for (let y = 0; y < cell.height; y++) {
        for (let x = 0; x < cell.width; x++) {
            const index = ((y + cell.y) * image.width + x + cell.x) * 4;
            const red = image.data[index];
            const green = image.data[index + 1];
            const blue = image.data[index + 2];
            const alpha = image.data[index + 3];
            const gray = (red * 2 + green * 5 + blue) / 8;
            const tone = red - green > 45 ? green : gray;
            if (alpha < 150 || tone > 195) continue;
            ink[y * cell.width + x] = Math.round(Math.max(0, tone - 40) * 255 / 155);
            left = Math.min(left, x);
            right = Math.max(right, x);
            top = Math.min(top, y);
            bottom = Math.max(bottom, y);
        }
    }
    return right >= left ? { ink, left, right, top, bottom, width: cell.width } : null;
}

export function makeStrip(image, cells, scale = 3) {
    const contents = cells.map(cell => cellInk(image, cell));
    const maxWidth = Math.max(0, ...contents.map(ink => ink ? ink.right - ink.left + 1 : 0));
    const maxHeight = Math.max(0, ...contents.map(ink => ink ? ink.bottom - ink.top + 1 : 0));
    const width = maxWidth * scale + 42;
    const pitch = maxHeight * scale + 38;
    const height = pitch * cells.length;
    const data = new Uint8ClampedArray(width * height * 4).fill(255);

    contents.forEach((content, row) => {
        if (!content) return;
        const { ink, left, right, top, bottom } = content;
        const cellWidth = (right - left + 1) * scale;
        const cellHeight = (bottom - top + 1) * scale;
        const offsetY = row * pitch + Math.floor((pitch - cellHeight) / 2);
        for (let y = 0; y < cellHeight; y++) {
            const sourceY = top + (y + 0.5) / scale - 0.5;
            const y0 = Math.floor(sourceY);
            const fractionY = sourceY - y0;
            for (let x = 0; x < cellWidth; x++) {
                const sourceX = left + (x + 0.5) / scale - 0.5;
                const x0 = Math.floor(sourceX);
                const fractionX = sourceX - x0;
                const sample = (cx, cy) => (cx < left || cx > right || cy < top || cy > bottom) ? 255 : ink[cy * content.width + cx];
                const topTone = sample(x0, y0) * (1 - fractionX) + sample(x0 + 1, y0) * fractionX;
                const bottomTone = sample(x0, y0 + 1) * (1 - fractionX) + sample(x0 + 1, y0 + 1) * fractionX;
                const value = topTone * (1 - fractionY) + bottomTone * fractionY;
                const index = ((offsetY + y) * width + x + 21) * 4;
                data[index] = data[index + 1] = data[index + 2] = value;
            }
        }
    });

    return { data, width, height, pitch, populated: contents.map(Boolean) };
}

export function readStripWords(blocks, pitch, size) {
    const rows = Array.from({ length: size }, () => []);
    for (const block of blocks || []) {
        for (const paragraph of block.paragraphs || []) {
            for (const line of paragraph.lines || []) {
                for (const word of line.words || []) {
                    const y = (word.bbox.y0 + word.bbox.y1) / 2;
                    rows[Math.floor(y / pitch)]?.push({ ...word, y });
                }
            }
        }
    }
    return rows.map(words => {
        words.sort((a, b) => Math.abs(a.y - b.y) < 12 ? a.bbox.x0 - b.bbox.x0 : a.y - b.y);
        return {
            text: words.map(word => word.text).join(' '),
            confidence: words.length ? Math.min(...words.map(word => word.confidence)) : 0,
        };
    });
}
