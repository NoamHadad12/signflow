import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css'; // Make sure to import the CSS file

// Import the component files
import UploadView from './components/UploadView';
import SignerView from './components/SignerView';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          {/* The default route: Upload screen */}
          <Route path="/" element={<UploadView />} />
          
          {/* The signing route: Requires a dynamic document ID */}
          <Route path="/sign/:documentId" element={<SignerView />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;