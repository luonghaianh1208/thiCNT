import { useState, useRef, useEffect } from 'react';

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}

export function SearchableSelect({ value, onChange, options, placeholder, className }: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedLabel = options.find(o => o.value === value)?.label || '';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative ${className || ''}`}>
      <button
        type="button"
        onClick={() => { setIsOpen(true); setSearch(''); setTimeout(() => inputRef.current?.focus(), 0); }}
        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-left text-base font-bold font-ui
                   focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue outline-none transition-all"
      >
        {selectedLabel || <span className="text-slate-400">{placeholder || 'CHỌN...'}</span>}
        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300">▼</span>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-brand-blue/20 rounded-2xl shadow-2xl overflow-y-auto scrollbar-custom" style={{ maxHeight: '320px' }}>
          <div className="p-3 border-b border-slate-100 sticky top-0 bg-white z-10">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm đơn vị..."
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-semibold font-ui outline-none focus:border-brand-blue"
            />
          </div>
          <div ref={listRef}>
            {filteredOptions.length === 0 ? (
              <p className="p-4 text-center text-slate-400 text-sm font-ui">Không tìm thấy</p>
            ) : (
              filteredOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setIsOpen(false); }}
                  className={`w-full px-6 py-4 text-left text-sm font-semibold font-ui transition-colors
                             ${opt.value === value ? 'bg-brand-blue text-white' : 'hover:bg-brand-blue/5 text-slate-700'}`}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
