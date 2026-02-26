import type { Column, ToCSVChunkMessage } from "./types";

export function objectsToCSV(
  jsonArray: ToCSVChunkMessage["data"],
  columns: ToCSVChunkMessage["columns"],
  includeHeaders: boolean,
) {
  if (!jsonArray.length || !columns.length) return "";

  const rows = [];

  if (includeHeaders) {
    rows.push(columns.map((col) => col.label).join(","));
  }

  jsonArray.forEach((row) => {
    rows.push(
      columns
        .map((col) => {
          const val: unknown = getNested(row, col.key);
          const normalizedValue = normalisedValue(val);
          const maybeFormattedValue = getFormatter(col, normalizedValue);

          return maybeFormattedValue;
        })
        .join(","),
    );
  });

  return `${rows.join("\n")}\n`;
}

function getNested(obj: Record<string, unknown>, keyPath: string): unknown {
  return keyPath.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") {
      return (acc as Record<string, unknown>)[key];
    }

    return undefined;
  }, obj);
}

function normalisedValue<T>(value: T): string | T {
  let result: string | T = value;

  if (typeof result === "string") {
    result = `"${result.replace(/"/g, '""')}"`;
  }

  if (result === undefined || result === null) {
    result = "";
  }

  return result;
}

function makeFormatters(locale = "en-US", timeZone = "UTC", currency = "USD") {
  return {
    dateFull: new Intl.DateTimeFormat(locale, { dateStyle: "full", timeZone }),
    dateMediumTime: new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone,
    }),
    numCompact: new Intl.NumberFormat(locale, {
      maximumFractionDigits: 1,
      notation: "compact",
    }),
    numCurrency: new Intl.NumberFormat(locale, {
      currency,
      maximumFractionDigits: 2,
      style: "currency",
    }),

    numDecimal: new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }),
    numPercent: new Intl.NumberFormat(locale, {
      maximumFractionDigits: 1,
      style: "percent",
    }),
    timeShort: new Intl.DateTimeFormat(locale, {
      timeStyle: "short",
      timeZone,
    }),
  };
}

const formatters = makeFormatters();
const availableFormatters = Object.keys(formatters);

function getFormatter(col: Column, value: unknown) {
  if ("formatType" in col && availableFormatters.includes(col.formatType as string)) {
    const enhance = formatters[col.formatType as keyof typeof formatters];

    return enhance.format(Number(value));
  } else {
    return value;
  }
}
