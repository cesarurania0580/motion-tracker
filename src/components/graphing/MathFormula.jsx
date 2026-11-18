import {useMemo} from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
// Only controlled equation templates and finite numeric results reach this renderer.
export default function MathFormula({tex,className=''}){
 const html=useMemo(()=>katex.renderToString(tex,{throwOnError:false,trust:false,strict:'error',output:'htmlAndMathml'}),[tex]);
 return <span className={`scientific-math ${className}`} dangerouslySetInnerHTML={{__html:html}}/>;
}
