import {useMemo,useState} from 'react';
import {Activity,ArrowUpRight,FlaskConical} from 'lucide-react';
import {parameterUnits} from '../../utils/analysisPresentation.js';
import GraphWorkspace from '../../components/graphing/GraphWorkspace.jsx';
import {TRIAL_TEXT} from '../../components/graphing/trialText.js';
import {SAMPLES,sampleRows} from './trialData.js';
function Session({sample,language,onBusy}) {
  const [dense,setDense]=useState(false);
  const rows=useMemo(()=>sampleRows(sample,dense),[sample,dense]);
  const t=TRIAL_TEXT[language];
  return <GraphWorkspace showDiagnostics key={String(dense)} sample={sample} language={language} onBusy={onBusy}
    rows={rows} initialModel={SAMPLES[sample].model} title={t[`${sample}Title`]}
    labels={{x:sample==='spectrum'?t.wavelength:t.time,y:sample==='spectrum'?t.intensity:t.position}}
    description={t[`${sample}Help`]} notice={t.synthetic}
    unitsForFit={model=>parameterUnits(model,'time','y',true)}
    extraDataControls={sample==='spectrum'&&<label className="trial-toggle">{t.dense}<input type="checkbox" checked={dense} onChange={e=>setDense(e.target.checked)}/></label>}/>;
}

export default function GraphingTrial(){
  const [language,setLanguage]=useState('en'),[sample,setSample]=useState('velocity'),[busy,setBusy]=useState(false);
  const t=TRIAL_TEXT[language];
  return <div className="graphing-trial" lang={language}>
    <header className="trial-header"><a className="trial-brand" href="/"><Activity size={24}/>{t.brand}<span>LAB</span></a>
      <div><label className="trial-language"><span className="trial-sr-only">{t.language}</span><select disabled={busy} value={language} onChange={e=>setLanguage(e.target.value)}><option value="en">English</option><option value="es">Español</option></select></label>
        <a href="/" className="trial-back">{t.back}<ArrowUpRight size={16}/></a></div>
    </header>
    <main className="trial-main"><div className="trial-intro"><span className="trial-kicker">{t.trial}</span><h1>{t.heading}</h1><p>{t.intro}</p></div>
      <nav className="trial-samples" aria-label={t.data}>{Object.keys(SAMPLES).map((key,i)=><button type="button" key={key} disabled={busy} aria-pressed={sample===key} onClick={()=>setSample(key)}><span>0{i+1}</span>{t[key]}</button>)}</nav>
      <Session key={sample} sample={sample} language={language} onBusy={setBusy}/>
      <footer className="trial-footer"><span><FlaskConical size={15}/>{t.sampleBadge}</span><p>{t.scope}</p></footer>
    </main>
  </div>;
}
