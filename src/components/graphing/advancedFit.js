import {fitSample} from './trialFigure.js';
import {MODEL_EQUATIONS} from './fitModels.js';
export const ADVANCED_MODELS={...MODEL_EQUATIONS,power:'y = A xᴮ',exponential:'y = A exp(Bx)',logarithmic:'y = A ln(x) + B'};
export function advancedFit(rows,model){
 if(!['power','exponential','logarithmic'].includes(model))return {fit:fitSample(rows,model),issue:null};
 if(rows.length<2)return {fit:null,issue:'points'};
 if(rows.some(r=>!Number.isFinite(r.x)||!Number.isFinite(r.y)))return {fit:null,issue:'finite'};
 if((model==='power'&&rows.some(r=>r.x<=0||r.y<=0))||(model==='exponential'&&rows.some(r=>r.y<=0))||(model==='logarithmic'&&rows.some(r=>r.x<=0)))return {fit:null,issue:model};
 const x=rows.map(r=>model==='exponential'?r.x:Math.log(r.x));
 const y=rows.map(r=>model==='logarithmic'?r.y:Math.log(r.y));
 const mean=a=>a.reduce((s,v)=>s+v/a.length,0),mx=mean(x),my=mean(y);
 const xx=x.reduce((s,v)=>s+(v-mx)**2,0);
 if(!(xx>0)||!Number.isFinite(xx))return {fit:null,issue:'range'};
 const slope=x.reduce((s,v,i)=>s+(v-mx)*(y[i]-my),0)/xx,offset=my-slope*mx;
 const A=model==='logarithmic'?slope:Math.exp(offset),B=model==='logarithmic'?offset:slope;
 if(![A,B].every(Number.isFinite)||(model!=='logarithmic'&&A===0))return {fit:null,issue:'range'};
 const fn=value=>{if(!Number.isFinite(value)||(model!=='exponential'&&value<=0))return null;const predicted=model==='logarithmic'?A*Math.log(value)+B:Math.exp(offset+B*(model==='power'?Math.log(value):value));return Number.isFinite(predicted)?predicted:null;};
 const predicted=rows.map(r=>fn(r.x));if(predicted.some(v=>v===null))return {fit:null,issue:'range'};
 const avg=mean(rows.map(r=>r.y)),ss=rows.reduce((s,r,i)=>s+(r.y-predicted[i])**2,0),total=rows.reduce((s,r)=>s+(r.y-avg)**2,0);
 if(!Number.isFinite(ss)||!Number.isFinite(total))return {fit:null,issue:'range'};
 const f=v=>Number(v.toPrecision(6)).toString();
 const text=model==='power'?`y = ${f(A)} x^(${f(B)})`:model==='exponential'?`y = ${f(A)} exp(${f(B)}x)`:`y = ${f(A)} ln(x) ${B<0?'−':'+'} ${f(Math.abs(B))}`;
 return {issue:null,fit:{type:model,params:{A,B},fn,text,rmse:Math.sqrt(ss/rows.length),r2:total===0?null:1-ss/total,method:model==='logarithmic'?'y':'log-y'}};
}
export const ADVANCED_FIT_TEXT={
 en:{points:'Add at least two points to fit.',finite:'Use finite numeric values.',power:'Power law requires X > 0 and Y > 0.',exponential:'Exponential requires Y > 0.',logarithmic:'Logarithmic requires X > 0.',range:'These data do not give a finite fit. Check the range and distinct X values.',logMethod:'Least squares in ln(Y); RMSE and R² shown in original Y.',noFit:'A fit could not be calculated for these data.'},
 es:{points:'Añade al menos dos puntos para ajustar.',finite:'Usa valores numéricos finitos.',power:'La ley de potencia requiere X > 0 e Y > 0.',exponential:'La exponencial requiere Y > 0.',logarithmic:'La logarítmica requiere X > 0.',range:'Estos datos no dan un ajuste finito. Revisa el rango y valores X distintos.',logMethod:'Mínimos cuadrados en ln(Y); RMSE y R² se muestran en Y original.',noFit:'No se pudo calcular un ajuste para estos datos.'}
};
