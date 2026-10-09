export function restoredImageTask(state) {
  if(state.lineProfile || state.wavelengthCalibration)return 'spectrum';
  if(state.tapeMeasure || state.protractor || state.pixelsPerMeter || state.objects?.some(o=>o.points?.length))return 'measure';
  return null;
}
export const IMAGE_TEXT={
 en:{workspace:'Image',choose:'What would you like to do with this image?',spectrum:'Analyze a spectrum',spectrumHelp:'Examine intensity, calibrate wavelengths, and compare elements.',measure:'Measure the image',measureHelp:'Measure distances and angles.',change:'Change task',distanceHelp:'Measure in pixels, or use Set scale in the toolbar to convert a known distance to real units.',angleHelp:'Angles do not need a distance scale.',coordinates:'Optional coordinates',coordinatesHelp:'Use the axes tool in the toolbar to set the origin and direction.',loading:'Loading image…'},
 es:{workspace:'Imagen',choose:'¿Qué quieres hacer con esta imagen?',spectrum:'Analizar un espectro',spectrumHelp:'Examina la intensidad, calibra longitudes de onda y compara elementos.',measure:'Medir la imagen',measureHelp:'Mide distancias y ángulos.',change:'Cambiar tarea',distanceHelp:'Mide en píxeles o usa Establecer escala en la barra para convertir una distancia conocida a unidades reales.',angleHelp:'Los ángulos no necesitan una escala de distancia.',coordinates:'Coordenadas opcionales',coordinatesHelp:'Usa la herramienta de ejes en la barra para establecer el origen y la dirección.',loading:'Cargando imagen…'},
};
