import React, {useEffect, useRef, useState} from 'react';
import {ANALYSIS_TEXT} from '../utils/analysisText';
import {prepareFile, triggerFileDownload, releaseFile} from '../utils/fileExport';

export default function ExportActions({actions, language, buttonClass}) {
  const text = ANALYSIS_TEXT[language] || ANALYSIS_TEXT.en;
  const [status, setStatus] = useState('');
  const [file, setFile] = useState(null);
  const currentFile = useRef(null);
  const busy = useRef(false);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; releaseFile(currentFile.current); };
  }, []);

  async function run(create) {
    if (busy.current) return;
    busy.current = true;
    setStatus('preparing');
    try {
      const result = create();
      const output = result && typeof result.then === 'function' ? await result : result;
      if (!mounted.current) return;
      const next = prepareFile(output.blob, output.fileName);
      releaseFile(currentFile.current);
      currentFile.current = next;
      setFile(next);
      setStatus('ready');
      // A failed/blocked automatic download still leaves the visible links usable.
      try { triggerFileDownload(next); } catch { /* user can tap Save file */ }
    } catch {
      if (mounted.current) setStatus('error');
    } finally { busy.current = false; }
  }

  return <div className="space-y-2">
    {actions.map(({label, create, icon}) => <button key={label} onClick={() => run(create)}
      disabled={status === 'preparing'} className={buttonClass}>{icon}{label}</button>)}
    <div role="status" aria-live="polite" className="text-xs space-y-2">
      {status === 'preparing' && <p>{text.exportPreparing}</p>}
      {status === 'error' && <p>{text.exportError}</p>}
      {file && <>
        <p>{text.exportReady} {file.fileName}</p>
        <div className="flex flex-wrap gap-3">
          <a className="underline min-h-11 inline-flex items-center" href={file.url} download={file.fileName}>{text.saveFile}</a>
          <a className="underline min-h-11 inline-flex items-center" href={file.url} target="_blank" rel="noopener noreferrer">{text.openFile}</a>
        </div>
        <p>{text.exportHint}</p>
      </>}
    </div>
  </div>;
}
