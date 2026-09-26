import { useEffect } from 'react';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeSort: string;
  onSortChange: (sort: string) => void;
  activeFilters: { brands: string[]; categories: string[] };
  onToggleFilter: (type: 'brands' | 'categories', value: string) => void;
  onClearFilters: () => void;
  brands: string[];
  categories: string[];
}

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest Arrivals' },
  { id: 'price-asc', label: 'Price: Low to High' },
  { id: 'price-desc', label: 'Price: High to Low' },
  { id: 'rating', label: 'Top Rated' },
];

const FilterDrawer = ({
  isOpen,
  onClose,
  activeSort,
  onSortChange,
  activeFilters,
  onToggleFilter,
  onClearFilters,
  brands,
  categories,
}: FilterDrawerProps) => {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const totalFilters = activeFilters.brands.length + activeFilters.categories.length;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div 
        className="fixed inset-y-0 right-0 h-full h-[100dvh] w-full max-w-md bg-surface shadow-2xl z-[101] flex flex-col animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
        aria-label="Filter and Sort"
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl text-ink" style={{ fontFamily: 'var(--font-display)' }}>
            Filter & Sort
          </h2>
          <button 
            onClick={onClose}
            className="text-muted hover:text-ink transition-colors text-lg"
            aria-label="Close filters"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-10" style={{ fontFamily: 'var(--font-body)' }}>
          
          {/* Sort Section */}
          <section>
            <h3 className="text-xs uppercase tracking-widest text-muted mb-4 font-medium">Sort By</h3>
            <div className="space-y-3">
              {SORT_OPTIONS.map((option) => (
                <label key={option.id} className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-5 h-5 rounded-full border border-border group-hover:border-ink transition-colors">
                    {activeSort === option.id && <div className="w-2.5 h-2.5 bg-ink rounded-full" />}
                  </div>
                  <input 
                    type="radio" 
                    name="sort" 
                    value={option.id} 
                    checked={activeSort === option.id}
                    onChange={() => onSortChange(option.id)}
                    className="sr-only"
                  />
                  <span className={`text-sm ${activeSort === option.id ? 'text-ink font-medium' : 'text-muted group-hover:text-ink transition-colors'}`}>
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </section>

          {/* Categories Section */}
          <section>
            <h3 className="text-xs uppercase tracking-widest text-muted mb-4 font-medium">Category</h3>
            <div className="space-y-3">
              {categories.map((cat) => (
                <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`flex items-center justify-center w-5 h-5 rounded border transition-colors ${
                    activeFilters.categories.includes(cat) ? 'bg-ink border-ink text-white' : 'border-border group-hover:border-ink bg-transparent'
                  }`}>
                    {activeFilters.categories.includes(cat) && <span className="text-[10px]">✓</span>}
                  </div>
                  <input 
                    type="checkbox" 
                    checked={activeFilters.categories.includes(cat)}
                    onChange={() => onToggleFilter('categories', cat)}
                    className="sr-only"
                  />
                  <span className={`text-sm ${activeFilters.categories.includes(cat) ? 'text-ink font-medium' : 'text-muted group-hover:text-ink transition-colors'}`}>
                    {cat}
                  </span>
                </label>
              ))}
            </div>
          </section>

          {/* Brands Section */}
          <section>
            <h3 className="text-xs uppercase tracking-widest text-muted mb-4 font-medium">Brand</h3>
            <div className="space-y-3">
              {brands.map((brand) => (
                <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`flex items-center justify-center w-5 h-5 rounded border transition-colors ${
                    activeFilters.brands.includes(brand) ? 'bg-ink border-ink text-white' : 'border-border group-hover:border-ink bg-transparent'
                  }`}>
                    {activeFilters.brands.includes(brand) && <span className="text-[10px]">✓</span>}
                  </div>
                  <input 
                    type="checkbox" 
                    checked={activeFilters.brands.includes(brand)}
                    onChange={() => onToggleFilter('brands', brand)}
                    className="sr-only"
                  />
                  <span className={`text-sm ${activeFilters.brands.includes(brand) ? 'text-ink font-medium' : 'text-muted group-hover:text-ink transition-colors'}`}>
                    {brand}
                  </span>
                </label>
              ))}
            </div>
          </section>

        </div>

        <div className="p-6 border-t border-border flex items-center gap-4 bg-surface">
          <button 
            onClick={onClearFilters}
            className={`text-sm underline underline-offset-4 transition-colors ${totalFilters > 0 ? 'text-muted hover:text-ink' : 'text-border cursor-not-allowed'}`}
            style={{ fontFamily: 'var(--font-body)' }}
            disabled={totalFilters === 0}
          >
            Clear All
          </button>
          <button 
            onClick={onClose}
            className="btn-primary flex-1 !py-3"
          >
            View Results {totalFilters > 0 && `(${totalFilters})`}
          </button>
        </div>
      </div>
    </>
  );
};

export default FilterDrawer;
