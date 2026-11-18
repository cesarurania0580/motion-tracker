export const MODEL_TEX={none:'',linear:String.raw`y=Ax+B`,quadratic:String.raw`y=Ax^{2}+Bx+C`,sinusoidal:String.raw`y=A\sin(\omega x+\varphi)+D`,power:String.raw`y=Ax^{B}`,exponential:String.raw`y=Ae^{Bx}`,logarithmic:String.raw`y=A\ln(x)+B`};
export const MODEL_NAMES={en:{none:'No fit',linear:'Linear',quadratic:'Quadratic',sinusoidal:'Sinusoidal',power:'Power law',exponential:'Exponential',logarithmic:'Logarithmic'},es:{none:'Sin ajuste',linear:'Lineal',quadratic:'Cuadrático',sinusoidal:'Sinusoidal',power:'Ley de potencia',exponential:'Exponencial',logarithmic:'Logarítmico'}};
export function mathNumber(value){
 if(!Number.isFinite(value))return String.raw`\text{undefined}`;
 const text=Number(value.toPrecision(6)).toString();
 if(!/[eE]/.test(text))return text;
 const [mantissa,exponent]=text.split(/[eE]/);return `${mantissa}\\times 10^{${Number(exponent)}}`;
}
const term=(value,suffix='')=>`${value<0?'-':'+'}${mathNumber(Math.abs(value))}${suffix}`;
export function fitTex(fit,model){
 if(!fit)return '';const p=fit.params,n=mathNumber;
 switch(model){
  case 'linear':return `y=${n(p.m)}x${term(p.b)}`;
  case 'quadratic':return `y=${n(p.A)}x^{2}${term(p.B,'x')}${term(p.C)}`;
  case 'sinusoidal':return `y=${n(p.A)}\\sin\\left(${n(p.B)}x${term(p.C)}\\right)${term(p.D)}`;
  case 'power':return `y=${n(p.A)}x^{${n(p.B)}}`;
  case 'exponential':return `y=${n(p.A)}e^{${n(p.B)}x}`;
  case 'logarithmic':return `y=${n(p.A)}\\ln(x)${term(p.B)}`;
  default:return '';
 }
}
