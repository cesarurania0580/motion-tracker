import TrackingModeMenu from './TrackingModeMenu';
import React, { useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { TRANSLATIONS } from '../utils/translations';
import { 
  Upload, Save, FolderOpen, RefreshCw, Sun, Moon, 
  Languages, Info, Move, Ruler, Eye, EyeOff,
  CheckCircle2, Menu, AlertCircle, Users, Activity 
} from 'lucide-react';

export default function Header({
  autotracking,
  handleObjectSwitch,
  handleScaleButtonClick,
  handleFileUpload,
  saveProject,
  loadProject,
  clearProject,
}) {
  const theme = useStore((state) => state.theme);
  const language = useStore((state) => state.language);
  const viewMode = useStore((state) => state.viewMode);
  const activeObjId = useStore((state) => state.activeObjId);
  const isSettingOrigin = useStore((state) => state.isSettingOrigin);
  const isCalibrating = useStore((state) => state.isCalibrating);
  const origin = useStore((state) => state.origin);
  const videoDims = useStore((state) => state.videoDims);
  const pixelsPerMeter = useStore((state) => state.pixelsPerMeter);
  const isScaleVisible = useStore((state) => state.isScaleVisible);
  const hasRestoredData = useStore((state) => state.hasRestoredData);
  const videoSrc = useStore((state) => state.videoSrc);
  const imageSrc = useStore((state) => state.imageSrc);
  const logoError = useStore((state) => state.logoError);
  const isMenuOpen = useStore((state) => state.isMenuOpen);

  const setTheme = useStore((state) => state.setTheme);
  const setLanguage = useStore((state) => state.setLanguage);
  const setViewMode = useStore((state) => state.setViewMode);
  const setIsTracking = useStore((state) => state.setIsTracking);
  const setIsSettingOrigin = useStore((state) => state.setIsSettingOrigin);
  const setIsCalibrating = useStore((state) => state.setIsCalibrating);
  const setOrigin = useStore((state) => state.setOrigin);
  const setShowInputModal = useStore((state) => state.setShowInputModal);
  const setLogoError = useStore((state) => state.setLogoError);
  const setIsMenuOpen = useStore((state) => state.setIsMenuOpen);
  const setShowAboutModal = useStore((state) => state.setShowAboutModal);

  const menuRef = useRef(null);
  const fileInputRef = useRef(null);

  const isDark = theme === 'dark';
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');
  const toggleLanguage = () => setLanguage(language === 'en' ? 'es' : 'en');

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setIsMenuOpen]);

  const styles = {
    bg: isDark ? 'bg-slate-900' : 'bg-slate-50',
    text: isDark ? 'text-white' : 'text-slate-900',
    textSecondary: isDark ? 'text-slate-400' : 'text-slate-500',
    panel: isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm',
    buttonSecondary: isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200',
    tableRow: isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50',
  };

  return (
    <div className={`p-4 border-b flex justify-between items-center shrink-0 h-16 ${styles.panel}`}>
      <div className="flex items-center gap-4">
        
        {/* LOGO IMAGE with Fallback */}
        {!logoError ? (
           <img 
             src={isDark ? "/logo-dark.png" : "/logo-light.png"} 
             alt="PhysTracker" 
             className="h-10 w-auto object-contain" 
             onError={() => setLogoError(true)}
           />
        ) : (
           <h1 className="text-xl font-bold">
              <span className={isDark ? "text-cyan-400" : "text-cyan-600"}>Phys</span>
              <span className={isDark ? "text-slate-200" : "text-slate-700"}>Tracker</span>
           </h1>
        )}

        <div className={`flex rounded p-1 border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
          <button onClick={() => setViewMode('tracker')} className={`px-4 py-1 text-sm rounded transition ${viewMode === 'tracker' ? (isDark ? 'bg-slate-700 text-white' : 'bg-white shadow-sm text-slate-900') : styles.textSecondary + ' hover:' + styles.text}`}>{t.trackerMode}</button>
          <button onClick={() => setViewMode('analysis')} className={`px-4 py-1 text-sm rounded transition ${viewMode === 'analysis' ? (isDark ? 'bg-slate-700 text-blue-400' : 'bg-white shadow-sm text-blue-600') : styles.textSecondary + ' hover:' + styles.text}`}>{t.analysisMode}</button>
        </div>
        
        {/* Object Switcher including COM */}
        <div className={`flex rounded p-1 border ml-2 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
            <button onClick={() => handleObjectSwitch('A')} className={`px-3 py-1 text-sm rounded flex items-center gap-1 transition ${activeObjId === 'A' ? 'bg-red-500 text-white shadow-sm' : styles.textSecondary}`}>
                <Users size={14}/> {t.objectA}
            </button>
            <button onClick={() => handleObjectSwitch('B')} className={`px-3 py-1 text-sm rounded flex items-center gap-1 transition ${activeObjId === 'B' ? 'bg-blue-500 text-white shadow-sm' : styles.textSecondary}`}>
                <Users size={14}/> {t.objectB}
            </button>
            <button onClick={() => handleObjectSwitch('COM')} className={`px-3 py-1 text-sm rounded flex items-center gap-1 transition ${activeObjId === 'COM' ? 'bg-purple-500 text-white shadow-sm' : styles.textSecondary}`}>
                <Activity size={14}/> {t.comShort}
            </button>
        </div>

      </div>
      
      <div className="flex gap-4 items-center">
        
        {viewMode === 'tracker' && (
          <>
            <TrackingModeMenu key={activeObjId} tracking={autotracking} />

            <button 
                onClick={() => { 
                  if (!origin && videoDims.w > 0) {
                     setOrigin({ x: videoDims.w / 2, y: videoDims.h / 2 });
                  }
                  setIsSettingOrigin(true); 
                  setIsCalibrating(false); 
                  setIsTracking(false); 
                  setShowInputModal(false); 
                }} 
                className={`flex items-center gap-2 px-3 py-2 rounded transition ${isSettingOrigin ? 'bg-blue-600 text-white' : styles.buttonSecondary}`}
                title={origin ? t.moveOrigin : t.setOrigin}
            > 
                <Move size={20} /> 
            </button>

            <button 
                onClick={handleScaleButtonClick} 
                className={`flex items-center gap-2 px-3 py-2 rounded transition ${isCalibrating ? 'bg-green-600 text-white' : pixelsPerMeter ? 'bg-green-100 text-green-700 border border-green-200' : styles.buttonSecondary}`}
                title={isCalibrating ? t.enterDistance : pixelsPerMeter ? (isScaleVisible ? t.hideScale : t.showScale) : t.setScale}
            > 
                {isCalibrating ? <CheckCircle2 size={20} /> : (pixelsPerMeter ? (isScaleVisible ? <Eye size={20} /> : <EyeOff size={20} />) : <Ruler size={20} />)} 
            </button>
          </>
        )}
        
        <label 
            className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition ${styles.buttonSecondary}`}
            title={t.uploadVideo}
        > 
            <Upload size={20} /> 
            <input type="file" accept="video/*,image/*" onChange={handleFileUpload} className="hidden" /> 
        </label>
         
         {/* Waiting for Video Alert */}
         {hasRestoredData && !videoSrc && !imageSrc && (
               <span className="text-xs text-orange-400 animate-pulse font-semibold flex items-center gap-1 hidden lg:flex">
                   <AlertCircle size={16} /> {t.waitingVideo}
               </span>
           )}

        {/* More Options Dropdown */}
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)} 
            className={`p-2 rounded-full transition ${isMenuOpen ? 'bg-slate-200 dark:bg-slate-700' : styles.buttonSecondary}`}
            title={t.moreOptions}
          >
            <Menu size={20} />
          </button>
          
          {isMenuOpen && (
            <div className={`absolute right-0 top-12 w-56 rounded-xl shadow-xl border overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100 ${styles.panel}`}>
              <div className="p-1 flex flex-col gap-1">
                 <button onClick={() => {saveProject(); setIsMenuOpen(false);}} className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 rounded-lg transition ${styles.tableRow}`}>
                    <Save size={16} className="text-blue-500"/> {t.saveProject}
                 </button>
                 <label className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 rounded-lg transition cursor-pointer ${styles.tableRow}`}>
                    <FolderOpen size={16} className="text-green-500"/> {t.loadProject}
                    <input type="file" ref={fileInputRef} onChange={(e) => {loadProject(e); setIsMenuOpen(false);}} accept=".json" className="hidden" />
                 </label>
                 <button onClick={() => {clearProject(); setIsMenuOpen(false);}} className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 rounded-lg transition hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500`}>
                    <RefreshCw size={16} /> {t.resetData}
                 </button>
                 
                 <div className={`h-px my-1 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                 
                 <button onClick={() => {toggleTheme(); setIsMenuOpen(false);}} className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 rounded-lg transition ${styles.tableRow}`}>
                    {isDark ? <Sun size={16} className="text-yellow-400"/> : <Moon size={16} className="text-indigo-400"/>} {t.switchTheme}
                 </button>
                 <button onClick={() => {toggleLanguage(); setIsMenuOpen(false);}} className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 rounded-lg transition ${styles.tableRow}`}>
                    <Languages size={16} className="text-purple-500"/> {language === 'en' ? 'Español' : 'English'}
                 </button>
                 <button onClick={() => {setShowAboutModal(true); setIsMenuOpen(false);}} className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 rounded-lg transition ${styles.tableRow}`}>
                    <Info size={16} className="text-cyan-500"/> {t.about}
                 </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
