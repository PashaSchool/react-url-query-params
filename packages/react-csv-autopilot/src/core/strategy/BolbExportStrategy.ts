import { BROADCAST_CHANNEL_NAME } from "../contants";
import type { ExportParams, ExportResponse, ExportStrategy, JobId } from "../types";
import WorkerManager from "../WorkerManager";

class BolbExportStrategy implements ExportStrategy {
  async export<T>(params: ExportParams<T>): Promise<ExportResponse> {
    const workerManager = WorkerManager.initialise();
    const suggestedName = params.fileName ?? "export";
    const filename = suggestedName.endsWith(".csv") ? suggestedName : `${suggestedName}.csv`;

    let iterator: JobId = 0 as JobId;
    let totalRowsLoaded = 0;

    const messaging = new BroadcastChannel(BROADCAST_CHANNEL_NAME);

    const csvParts: BlobPart[] = [];

    try {
      while (true) {
        const response = await params.getNextPage(iterator++);

        const safeRows = Array.isArray(response.rows) ? response.rows : [];
        const safeTotal = response.total ?? 0;

        const isRowsEmpty = safeRows.length === 0;

        const nextRowsLoaded = totalRowsLoaded + safeRows.length;
        totalRowsLoaded = isRowsEmpty ? safeTotal : nextRowsLoaded;

        const isFinished = safeTotal > 0 ? totalRowsLoaded >= safeTotal : isRowsEmpty;

        if (isRowsEmpty) {
          messaging.postMessage(
            JSON.stringify({
              loadedItemsCount: totalRowsLoaded,
              total: safeTotal,
              type: "done",
            }),
          );

          await workerManager.triggerWorker({
            id: iterator,
            type: "completed",
          });

          break;
        }

        const csvChunk = (await workerManager.triggerWorker({
          columns: params.columns,
          data: safeRows as Record<string, unknown>[],
          id: iterator,
          type: "to_csv_chunk",
        })) as string;

        csvParts.push(csvChunk);

        messaging.postMessage(
          JSON.stringify({
            loadedItemsCount: totalRowsLoaded,
            total: safeTotal,
            type: "progress",
          }),
        );

        if (isFinished) {
          messaging.postMessage(
            JSON.stringify({
              loadedItemsCount: totalRowsLoaded,
              total: safeTotal,
              type: "done",
            }),
          );

          await workerManager.triggerWorker({
            id: iterator,
            type: "completed",
          });

          break;
        }
      }

      const blob = new Blob(["\uFEFF", ...csvParts], {
        type: "text/csv;charset=utf-8",
      });

      this.downloadBlob(blob, filename);

      return { finished: true, totalRowsLoaded };
    } catch (error) {
      messaging.postMessage(
        JSON.stringify({
          loadedItemsCount: totalRowsLoaded,
          total: 0,
          type: "failed",
        }),
      );
      throw error;
    } finally {
      messaging.close();
      workerManager.terminate();
    }
  }

  private downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";

    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  }
}

export default BolbExportStrategy;
