'use client';

import { useState, useEffect } from 'react';

export function MaterialSelector({ selectedMaterials, onSelectMaterials }: { selectedMaterials: string[], onSelectMaterials: (ids: string[]) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [materials, setMaterials] = useState<any[]>([]);

  useEffect(() => {
    // Fetch user materials when opened
    if (isOpen && materials.length === 0) {
      fetch('/api/materials')
        .then(res => res.json())
        .then(data => {
          // Display only successfully processed context files
          setMaterials(data.data?.materials?.filter((m: any) => m.isProcessed) || []);
        });
    }
  }, [isOpen]);

  const toggleMaterial = (id: string) => {
    if (selectedMaterials.includes(id)) {
      onSelectMaterials(selectedMaterials.filter(m => m !== id));
    } else {
      onSelectMaterials([...selectedMaterials, id]);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors flex items-center gap-2"
      >
        <span>📚 Context</span>
        <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-medium px-1.5 py-0.5 rounded text-xs">
          {selectedMaterials.length}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-lg rounded-lg overflow-hidden z-50">
          <div className="p-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-semibold">Select Study Context</h3>
            <p className="text-xs text-slate-500 mt-0.5">Choose documents the AI should read.</p>
          </div>
          
          <div className="max-h-60 overflow-y-auto p-2">
            {materials.length === 0 ? (
              <p className="text-sm text-center text-slate-500 py-4">No processed materials found. Upload and process documents first.</p>
            ) : (
              materials.map(material => (
                <label 
                  key={material.id} 
                  className={`flex items-start gap-2 p-2 rounded-md cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 ${
                    selectedMaterials.includes(material.id) ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedMaterials.includes(material.id)}
                    onChange={() => toggleMaterial(material.id)}
                    className="mt-1 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{material.title}</p>
                    <p className="text-xs text-slate-500">{material.type} • {material.chunkCount} segments</p>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
