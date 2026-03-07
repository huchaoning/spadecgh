import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Navbar from './components/Navbar.jsx';
import Sidebar from './components/Sidebar.jsx';
import Canvas from './components/Canvas.jsx';

export default function App() {
  const [showSidebar, setShowSidebar] = useState(true);
  const [sigma, setSigma] = useState(100);
  const [pixelSize, setPixelSize] = useState(8);
  const [modes, setModes] = useState([
    { id: 1, type: 'HG', n: 0, m: 1, nx: 500, ny: 0 }
  ]);

  // --- 逻辑处理函数 ---
  const addMode = () => {
    const newId = modes.length > 0 ? Math.max(...modes.map(m => m.id)) + 1 : 1;
    setModes([...modes, { id: newId, type: 'HG', n: 0, m: 0, nx: 500, ny: 0 }]);
  };

  const removeMode = (id) => setModes(modes.filter(m => m.id !== id));

  const updateMode = (id, field, value) => {
    setModes(modes.map(m => {
      if (m.id === id) {
        if (field === 'type' && value === 'PM') {
          return { ...m, type: value, plusModes: [], minusModes: [] };
        }
        const val = field === 'type' ? value : (parseInt(value) || 0);
        return { ...m, [field]: val };
      }
      return m;
    }));
  };

  const handleAddSubMode = (parentId, groupKey, type) => {
    setModes(modes.map(m => {
      if (m.id === parentId) {
        const subId = Date.now() + Math.random();
        return { ...m, [groupKey]: [...(m[groupKey] || []), { id: subId, type, n: 0, m: 0 }] };
      }
      return m;
    }));
    if (document.activeElement) document.activeElement.blur();
  };

  const removeSubMode = (parentId, groupKey, subId) => {
    setModes(modes.map(m => (m.id === parentId ? { ...m, [groupKey]: m[groupKey].filter(s => s.id !== subId) } : m)));
  };

  const updateSubMode = (parentId, groupKey, subId, field, value) => {
    setModes(modes.map(m => {
      if (m.id === parentId) {
        const newList = m[groupKey].map(s => s.id === subId ? { ...s, [field]: parseInt(value) || 0 } : s);
        return { ...m, [groupKey]: newList };
      }
      return m;
    }));
  };

  return (
    <div className="flex flex-col h-screen bg-base-200 overflow-hidden text-sm font-sans">
      <Navbar showSidebar={showSidebar} setShowSidebar={setShowSidebar} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          showSidebar={showSidebar}
          sigma={sigma}
          setSigma={setSigma}
          pixelSize={pixelSize}
          setPixelSize={setPixelSize}
          modes={modes}
          addMode={addMode}
          removeMode={removeMode}
          updateMode={updateMode}
          handleAddSubMode={handleAddSubMode}
          removeSubMode={removeSubMode}
          updateSubMode={updateSubMode}
          setModes={setModes}
        />
        <Canvas />
      </div>

      {/* Clear Confirmation Modal */}
      <dialog id="clear_modal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h3 className="font-bold text-lg text-error flex items-center gap-2">
            <AlertTriangle size={20} /> 确认清除？
          </h3>
          <p className="py-4 text-sm text-base-content/60">此操作将清空所有已配置的模式。该操作不可撤销。</p>
          <div className="modal-action">
            <form method="dialog" className="flex gap-2 w-full justify-end">
              <button className="btn btn-ghost btn-sm">取消</button>
              <button className="btn btn-error btn-sm px-6" onClick={() => setModes([])}>确认</button>
            </form>
          </div>
        </div>
      </dialog>
    </div>
  );
}