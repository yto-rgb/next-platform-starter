export const DEFAULT_AGENTS = 'NY-T\nTB\nCNE\nECMS\nNY';
export const DEFAULT_NY_KEYWORD = '自';

export const normalize = value => String(value ?? '').normalize('NFKC').trim();

export function dateKey(value) {
    const date = normalize(value).replace(/\s/g, '').replace(/年|月/g, '/').replace(/日$/, '');
    const match = date.match(/^(?:(\d{4})[-/.])?(\d{1,2})[-/.](\d{1,2})$/);
    if (!match) return '';
    const [, year, month, day] = match;
    const check = new Date(Date.UTC(Number(year || 2000), Number(month) - 1, Number(day)));
    if (check.getUTCMonth() + 1 !== Number(month) || check.getUTCDate() !== Number(day)) return '';
    const monthDay = `${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    return year ? `${year}-${monthDay}` : monthDay;
}

export function masterNumber(value) {
    const digits = normalize(value).replace(/[\s‐‑–—-]/g, '');
    return /^\d{11}$/.test(digits) ? digits : '';
}

export function passesAwbCheck(number) {
    return /^\d{11}$/.test(number) && Number(number.slice(3, 10)) % 7 === Number(number[10]);
}

export const hasSfMarker = value => /(?:^|[^A-Z])S\s*\/?\s*F(?![A-Z])/i.test(normalize(value));

export function numbersInNote(value) {
    const note = normalize(value);
    const candidates = note.matchAll(/(?<!\d)(\d{3}[‐‑–— -]?\d{8})(?!\d)/g);
    const numbers = [...new Set(Array.from(candidates, match => masterNumber(match[1])))];
    if (numbers.length) return numbers;
    const fragmented = note.matchAll(/(?:^|[^\d])(\d(?:[ \t-]*\d){10})(?![ \t-]*\d)/g);
    return [...new Set(Array.from(fragmented, match => masterNumber(match[1])))];
}

export function dateLabel(key) {
    return key.split('-').map(part => String(Number(part))).join('/');
}

export function extractRows(rows, date, agentList, nyKeyword) {
    const agents = new Set(agentList.split(/[\n,，、]+/).map(value => normalize(value).toUpperCase()).filter(Boolean));
    const keyword = normalize(nyKeyword).replace(/\s/g, '');
    const results = [];
    const issues = [];
    const seen = new Set();

    for (const row of rows) {
        const agent = normalize(row.agent).toUpperCase().replace(/\s/g, '').replace(/[‐‑–—]/g, '-');
        const recordedDate = dateKey(row.date);
        if (!agents.has(agent) || (recordedDate && date && date !== recordedDate)) continue;
        if (!recordedDate) {
            issues.push({ row, reason: 'C 列日期需要核对' });
            continue;
        }
        const note = normalize(row.note);
        if (agent === 'NY' && (!keyword || !note.replace(/\s/g, '').includes(keyword))) continue;

        let master = masterNumber(row.master);
        let pieces = normalize(row.pieces).replace(/[,\s]/g, '');
        if (hasSfMarker(note)) {
            const numbers = numbersInNote(note);
            master = numbers.length === 1 ? numbers[0] : '';
            pieces = 'SF';
        }

        if (!master || (pieces && pieces !== 'SF' && !/^\d+$/.test(pieces))) {
            issues.push({ row, reason: !master ? `${pieces === 'SF' ? 'H' : 'E'} 列主单号需要核对` : 'G 列件数需要核对' });
            continue;
        }
        const result = { master, agent, pieces, row };
        const key = `${recordedDate}\t${master}\t${agent}\t${pieces}`;
        if (seen.has(key)) continue;
        seen.add(key);
        results.push(result);
    }

    return { results, issues };
}
