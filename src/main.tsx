import {createRoot} from 'react-dom/client';
import GameApp from './game/GameApp.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<GameApp />);
