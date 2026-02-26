import { useBatchUrlParams, useUrlParams } from 'react-url-query-params';
import { type ExportController, ExportControllerSingleton } from 'export-csv-core';
import { useEffect, useRef, useState } from 'react';
import viteLogo from '/vite.svg';
import reactLogo from './assets/react.svg';
import './App.css';

async function fetchData(nextIteration: number) {
  const searchParams = new URLSearchParams({
    _page: String(nextIteration),
    limit: '10',
  });

  const response = await fetch(`https://jsonplaceholder.typicode.com/posts?${searchParams.toString()}`);
  const data = await response.json();

  console.log({ data });
  return data;
}

const BENCHMARK = 'my_export';

function useExportCSV() {
  const exportCallbackRef = useRef<ExportController>(ExportControllerSingleton.init());

  return {
    handler: exportCallbackRef.current!,
  };
}

type Payload = {
  payload: { total: number; state: 'pending' | 'success' | 'failed' };
};

function useMessageExportCSV(cb: (payload: Payload) => void) {
  useEffect(() => {
    const channel = new BroadcastChannel(BENCHMARK);

    channel.addEventListener('message', (params) => {
      const json = JSON.parse(params.data);

      if (json.type === 'progress') {
        cb(json);
      }
    });

    return () => {
      channel.close();
    };
  }, [cb]);
}

function UrlParamsDemo() {
  const { view, setView, toggleView, clearView, isViewGrid, isViewTable } = useUrlParams({
    keyName: 'view',
    options: ['grid', 'table'] as const,
  });

  const { set, clearParams, isFilterActive, isFilterInactive, isSortAsc, isSortDesc } = useBatchUrlParams({
    filter: ['active', 'inactive'] as const,
    sort: ['asc', 'desc'] as const,
  });

  return (
    <div style={{ border: '1px solid #444', borderRadius: 8, padding: '1rem', marginBottom: '1rem', textAlign: 'left' }}>
      <h2>react-url-query-params demo</h2>

      <section style={{ marginBottom: '1rem' }}>
        <h3>useUrlParams — single param</h3>
        <p>Current URL param <code>?view</code>: <strong>{view ?? 'null'}</strong></p>
        <p>isViewGrid: <strong>{String(isViewGrid)}</strong> | isViewTable: <strong>{String(isViewTable)}</strong></p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setView('grid')}>setView('grid')</button>
          <button onClick={() => setView('table')}>setView('table')</button>
          <button onClick={() => toggleView()}>toggleView()</button>
          <button onClick={() => clearView()}>clearView()</button>
          <button onClick={() => setView('grid', { replace: true })}>setView('grid', replace)</button>
        </div>
      </section>

      <section>
        <h3>useBatchUrlParams — multiple params</h3>
        <p>isFilterActive: <strong>{String(isFilterActive)}</strong> | isFilterInactive: <strong>{String(isFilterInactive)}</strong></p>
        <p>isSortAsc: <strong>{String(isSortAsc)}</strong> | isSortDesc: <strong>{String(isSortDesc)}</strong></p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => set({ filter: 'active', sort: 'asc' })}>set active + asc</button>
          <button onClick={() => set({ filter: 'inactive', sort: 'desc' })}>set inactive + desc</button>
          <button onClick={() => set({ filter: 'active' })}>set filter only</button>
          <button onClick={() => clearParams()}>clearParams()</button>
        </div>
      </section>
    </div>
  );
}

function App() {
  const [count, setCount] = useState(0);

  const { handler } = useExportCSV();

  useMessageExportCSV((_payload) => {
    // console.log("useMessageExportCSV::", {payload})
  });

  return (
    <>
      <UrlParamsDemo />
      <div>
        <button
          type="button"
          onClick={async () => {
            const _response = await handler.start({
              fileName: BENCHMARK,
              getNextPage: async (skipIterationNumber) => {
                const rows = await fetchData(skipIterationNumber);
                // console.log("my_export", {skipIterationNumber, rows})

                return rows;
              },
              columns: [
                { key: 'id', label: 'ID' },
                { key: 'title', label: 'Title' },
                { key: 'body', label: 'Content' },
                { key: 'userId', label: 'USER ID' },
              ],
            });

            // console.log("response::", {response})
          }}
        >
          <img
            src={viteLogo}
            className="logo"
            alt="Vite logo"
          />
        </button>
        <a
          href="https://react.dev"
          target="_blank"
          rel="noopener"
        >
          <img
            src={reactLogo}
            className="logo react"
            alt="React logo"
          />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>count is {count}</button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">Click on the Vite and React logos to learn more</p>
    </>
  );
}

export default App;
