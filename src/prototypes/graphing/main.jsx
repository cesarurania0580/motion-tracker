import {createRoot} from 'react-dom/client';
import GraphingTrial from './GraphingTrial.jsx';
import '../../components/graphing/trial.css';

// Isolated entry: no App, project store, autosave, or main-application CSS.
createRoot(document.getElementById('root')).render(<GraphingTrial/>);
