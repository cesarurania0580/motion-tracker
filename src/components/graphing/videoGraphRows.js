export const errorKey=key=>key==='time'?'timeError':`${key}Error`;
export function videoGraphRows(data,x,y){
 return data.filter(row=>!row.isVirtual&&Number.isFinite(row[x])&&Number.isFinite(row[y])).map(row=>({x:row[x],y:row[y],xError:row[errorKey(x)]??null,error:row[errorKey(y)]??null}));
}
