export const workerCode = `
const headersWritten = new Map();

function getNested(obj, keyPath) {
  return keyPath.split(".").reduce((acc, key) => {
    if (acc && typeof acc === "object") {
      return acc[key];
    }
    return undefined;
  }, obj);
}

function normalisedValue(value) {
  let result = value;

  if (typeof result === "string") {
    result = '"' + result.replace(/"/g, '""') + '"';
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

function getFormatter(col, value) {
  if ("formatType" in col && availableFormatters.includes(col.formatType)) {
    const enhance = formatters[col.formatType];
    return enhance.format(Number(value));
  } else {
    return value;
  }
}

function objectsToCSV(jsonArray, columns, includeHeaders) {
  if (!jsonArray.length || !columns.length) return "";

  const rows = [];

  if (includeHeaders) {
    rows.push(columns.map((col) => col.label).join(","));
  }

  jsonArray.forEach((row) => {
    rows.push(
      columns
        .map((col) => {
          const val = getNested(row, col.key);
          const normalizedValue = normalisedValue(val);
          const maybeFormattedValue = getFormatter(col, normalizedValue);
          return maybeFormattedValue;
        })
        .join(",")
    );
  });

  return rows.join("\\n") + "\\n";
}

self.onmessage = (event) => {
  const msg = event.data;
  try {
    switch (msg.type) {
      case "to_csv_chunk": {
        const { columns, data, id } = msg;
        const csvChunk = objectsToCSV(data, columns, !headersWritten.get(id));
        const out = {
          id,
          result: csvChunk,
          type: "csv_chunk",
        };

        headersWritten.set(id, true);

        self.postMessage(out);
        break;
      }

      case "completed": {
        const out = { id: msg.id, type: "done" };
        self.postMessage(out);
        break;
      }

      default: {
        console.warn("Unsupported worker message: " + JSON.stringify(msg));
        break;
      }
    }
  } catch (error) {
    const _error = error instanceof Error ? error : new Error(String(error));

    self.postMessage({
      error: { name: _error.name, message: _error.message, stack: _error.stack },
      id: msg.id,
      type: "error",
    });
  }
};
`;
