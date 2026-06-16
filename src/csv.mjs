export function parseCsv(text) {
  const rows = [];
  const lines = String(text).trim().split(/\r?\n/).filter(Boolean);

  if (!lines.length) {
    return [];
  }

  const headers = parseCsvLine(lines[0]);

  for (const line of lines.slice(1)) {
    const cells = parseCsvLine(line);
    rows.push(Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""])));
  }

  return rows;
}

export function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells;
}

export function stringifyCsv(rows, headers = null) {
  const resolvedHeaders = headers || Array.from(
    rows.reduce((set, row) => {
      for (const key of Object.keys(row)) set.add(key);
      return set;
    }, new Set())
  );

  const lines = [resolvedHeaders.map(escapeCsvCell).join(",")];

  for (const row of rows) {
    lines.push(resolvedHeaders.map((header) => escapeCsvCell(row[header] ?? "")).join(","));
  }

  return `${lines.join("\n")}\n`;
}

function escapeCsvCell(value) {
  const text = String(value);

  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}
