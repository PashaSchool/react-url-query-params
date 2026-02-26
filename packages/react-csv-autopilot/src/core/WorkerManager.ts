import { WEB_WORKER_NAME } from "./contants";
import type { JobId, ToWorkerMessage } from "./types";
import { workerCode } from "./workerCode";

function createWorkerBlobUrl(): string {
  const blob = new Blob([workerCode], { type: "application/javascript" });
  return URL.createObjectURL(blob);
}

class WorkerManager {
  #worker: Worker | null;
  #blobUrl: string | null;
  #pending = new Map<JobId, { resolve: (value: unknown) => void; reject: (reason?: ErrorEvent) => void }>();

  constructor() {
    this.#blobUrl = createWorkerBlobUrl();

    this.#worker = new Worker(this.#blobUrl, {
      name: WEB_WORKER_NAME,
    });

    this.#listenerRegistry();
  }

  static initialise() {
    return new WorkerManager();
  }

  #listenerRegistry() {
    this.#worker?.addEventListener("message", (event) => {
      const { id, result, error } = event.data;
      const entity = this.#pending.get(id);

      if (!entity) {
        return;
      }

      this.#pending.delete(id);

      if (error) {
        entity.reject(error);
      } else {
        entity.resolve(result);
      }
    });

    this.#worker?.addEventListener("error", (event) => {
      for (const [, { reject }] of this.#pending) {
        reject(event);
      }

      this.#pending.clear();
    });
  }

  async triggerWorker(payload: ToWorkerMessage) {
    const id = payload.id ?? Math.random().toString(36).substr(2);

    const p = new Promise((resolve, reject) => {
      this.#pending.set(id, { reject, resolve });
    });

    this.#worker?.postMessage(payload);

    return p;
  }

  terminate() {
    if (this.#worker) {
      this.#worker.terminate();
      this.#worker = null;
    }

    if (this.#blobUrl) {
      URL.revokeObjectURL(this.#blobUrl);
      this.#blobUrl = null;
    }
  }
}

export default WorkerManager;
