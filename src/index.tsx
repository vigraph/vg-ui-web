import 'react-app-polyfill/ie9';
import 'react-app-polyfill/stable';
import 'pepjs';
import * as React from 'react';
import App from './App';
import './index.css';
import registerServiceWorker from './registerServiceWorker';

import { createRoot } from 'react-dom/client';
const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App/>);

registerServiceWorker();
