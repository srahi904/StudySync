'use client';

import { useState, useEffect } from 'react';
import { BookOpenText } from 'lucide-react';

export function MaterialSelector({
  selectedMaterials,
  onSelectMaterials,
}: {
  selectedMaterials: string[];
  onSelectMaterials: (ids: string[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [materials, setMaterials] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && materials.length === 0) {
      fetch('/api/materials')
        .then((res) => res.json())
        .then((data) => {
          const processed = data.data?.materials?.filter((m: any) => m.isProcessed) || [];
          setMaterials(processed);
        })
        .catch(() => setMaterials([]));
    }
  }, [isOpen, materials.length]);

  const toggleMaterial = (id: string) => {
    if (selectedMaterials.includes(id)) {
      onSelectMaterials(selectedMaterials.filter((m) => m !== id));
      return;
    }
    onSelectMaterials([...selectedMaterials, id]);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted/50"
      >
        <BookOpenText className="h-4 w-4" />
        Context
        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary">
          {selectedMaterials.length}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-96 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
          <div className="border-b border-border px-4 py-3">
            <p className="text-lg font-semibold text-foreground">Select Study Context</p>
            <p className="text-sm text-muted-foreground">Choose documents the AI should read.</p>
          </div>

          <div className="max-h-80 space-y-2 overflow-y-auto p-3">
            {materials.length === 0 ? (
              <p className="rounded-lg border border-border bg-background/40 p-3 text-sm text-muted-foreground">
                No processed materials found. Upload and process documents first.
              </p>
            ) : (
              materials.map((material) => {
                const checked = selectedMaterials.includes(material.id);
                return (
                  <label
                    key={material.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                      checked
                        ? 'border-primary/40 bg-primary/10'
                        : 'border-border bg-background/30 hover:border-border/80'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleMaterial(material.id)}
                      className="mt-1"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{material.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {material.type} · {material.chunkCount || 0} segments
                      </p>
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
