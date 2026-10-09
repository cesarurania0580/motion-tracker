import test from 'node:test';
import assert from 'node:assert/strict';
import {plottedCoordinates,formatCoordinate,axisUnit,parameterUnits,interpretationKey} from '../src/utils/analysisPresentation.js';
import {ANALYSIS_TEXT} from '../src/utils/analysisText.js';

test('ANA-02: duplicate scatter/error layers yield only selected measurement coordinates',()=>{
  const row={time:.06666699999999892,x:.01,y:-.048,error:.001,fitY:-.05};
  const payload=[{dataKey:'fitYContinuous',payload:{time:.065,fitYContinuous:-.05,isVirtual:true}},
    {dataKey:'time',payload:row},{dataKey:'y',payload:row},{dataKey:'y',payload:row}];
  assert.deepEqual(plottedCoordinates(payload,'time','y'),[{key:'time',value:row.time},{key:'y',value:-.048}]);
  assert.deepEqual(plottedCoordinates(payload,'x','y'),[{key:'x',value:.01},{key:'y',value:-.048}]);
  assert.deepEqual(plottedCoordinates(payload,'time','time'),[{key:'time',value:row.time}]);
});

test('ANA-02: virtual fit samples and absent/nonfinite coordinates cannot appear as measurements',()=>{
  assert.deepEqual(plottedCoordinates([{payload:{isVirtual:true,time:1,fitYContinuous:2}}],'time','time'),[]);
  assert.deepEqual(plottedCoordinates([{payload:{time:1,vy:null}},{payload:{time:2,vy:NaN}}],'time','vy'),[]);
  assert.deepEqual(plottedCoordinates(undefined,'time','y'),[]);
});

test('ANA-02: display formatting removes floating-point tails without hiding tiny values',()=>{
  assert.equal(formatCoordinate(.06666699999999892),'0.067');
  assert.equal(formatCoordinate(-.048),'-0.048');
  assert.equal(formatCoordinate(-0),'0');
  assert.equal(formatCoordinate(.000000234),'2.340e-7');
  assert.equal(formatCoordinate(23456789),'2.346e+7');
  assert.equal(formatCoordinate(Infinity),'—');
});

test('ANA-03/04: parameter dimensions follow selected axes and calibration',()=>{
  assert.equal(axisUnit('x',false),'px');
  assert.equal(axisUnit('vy',false),'px/s');
  assert.equal(axisUnit('time',true),'s');
  assert.deepEqual(parameterUnits('Linear','time','y',true),{m:'m/s',b:'m'});
  assert.deepEqual(parameterUnits('Quadratic','time','y',true),{A:'m/s²',B:'m/s',C:'m'});
  assert.deepEqual(parameterUnits('Linear','time','vx',false),{m:'px/s²',b:'px/s'});
  assert.deepEqual(parameterUnits('Linear','x','y',true),{m:'',b:'m'});
  assert.deepEqual(parameterUnits('Sinusoidal','time','x',true),{A:'m',B:'rad/s',C:'rad',D:'m'});
  assert.equal(parameterUnits('Sinusoidal','x','y',false).B,'rad/px');
});

test('ANA-04/05: interpretations depend on axes and translations cover both languages',()=>{
  assert.equal(interpretationKey('Linear','time','y'),'positionLinear');
  assert.equal(interpretationKey('Linear','time','vx'),'velocityLinear');
  assert.equal(interpretationKey('Quadratic','time','x'),'positionQuadratic');
  assert.equal(interpretationKey('Quadratic','x','y'),'quadraticHelp');
  assert.equal(interpretationKey('Sinusoidal','time','x'),'sinusoidalHelp');
  assert.deepEqual(Object.keys(ANALYSIS_TEXT.en).sort(),Object.keys(ANALYSIS_TEXT.es).sort());
});
