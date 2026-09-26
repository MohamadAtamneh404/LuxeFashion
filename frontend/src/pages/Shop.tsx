import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Seo from '../components/Seo';
import ProductGrid from '../components/products/ProductGrid';

import FilterDrawer from '../components/products/FilterDrawer';

function Shop() {
  const { category: routeCategory } = useParams();
  const [searchParams] = useSearchParams();
  const isNewArrivals = searchParams.get('sort') === 'new';
  const searchQuery = (searchParams.get('q') || '').trim();
  const isSearch = searchQuery.length > 0;

  // We no longer use simple selectedCategory since we support multiple categories
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeSort, setActiveSort] = useState(isNewArrivals ? 'newest' : 'newest');
  
  const [activeFilters, setActiveFilters] = useState<{brands: string[], categories: string[]}>({
    brands: [],
    categories: routeCategory ? [routeCategory] : []
  });

  // Keep route in sync
  useEffect(() => {
    if (routeCategory) {
      setActiveFilters(prev => ({ ...prev, categories: [routeCategory] }));
    }
  }, [routeCategory]);

  const handleToggleFilter = (type: 'brands' | 'categories', value: string) => {
    setActiveFilters(prev => {
      const current = prev[type];
      const updated = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [type]: updated };
    });
  };

  const handleClearFilters = () => {
    setActiveFilters({ brands: [], categories: [] });
  };

  const totalFilters = activeFilters.brands.length + activeFilters.categories.length;

  return (
    <Layout>
      <Seo
        title={isSearch ? `Search: ${searchQuery}` : isNewArrivals ? 'New Arrivals' : 'Shop All Collections'}
        description={
          isSearch
            ? `Search results for ${searchQuery} across the LuxeFashion collection.`
            : isNewArrivals
              ? 'The latest drops from LuxeFashion — fresh silhouettes added in the last two weeks.'
              : 'Shop timeless pieces for every occasion — premium fabrics, clean silhouettes, free worldwide shipping.'
        }
        path={routeCategory ? `/shop/${routeCategory}` : '/shop'}
      />
      <div className="max-w-7xl mx-auto px-8 py-20">

        {/* Page header */}
        <div className="mb-10 text-center">
          <p className="text-xs uppercase tracking-widest text-muted mb-3"
            style={{ fontFamily: 'var(--font-body)' }}>
            {isSearch ? 'Search' : isNewArrivals ? 'Just Landed' : 'Explore'}
          </p>
          <h1 className="text-5xl md:text-6xl text-ink mb-4"
            style={{ fontFamily: 'var(--font-display)' }}>
            {isSearch ? `Results for “${searchQuery}”` : isNewArrivals ? 'New Arrivals' : 'All Collections'}
          </h1>
          <p className="text-muted max-w-md mx-auto text-sm leading-relaxed"
            style={{ fontFamily: 'var(--font-body)' }}>
            {isSearch
              ? 'Pieces matching your search across every collection.'
              : isNewArrivals
                ? 'The latest drops, newest first — fresh silhouettes added in the last two weeks carry the NEW mark.'
                : 'Timeless pieces for every occasion — crafted for those who move with intention.'}
          </p>
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex justify-end mb-8">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border-[1.5px] border-border hover:border-ink transition-colors text-sm"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            <span>Filter & Sort</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 4.66667H14M4 8H12M6.66667 11.3333H9.33333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {totalFilters > 0 && (
              <span className="ml-1 flex items-center justify-center w-5 h-5 bg-ink text-surface rounded-full text-[10px] font-medium">
                {totalFilters}
              </span>
            )}
          </button>
        </div>

        <FilterDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          activeSort={activeSort}
          onSortChange={setActiveSort}
          activeFilters={activeFilters}
          onToggleFilter={handleToggleFilter}
          onClearFilters={handleClearFilters}
          brands={['Luxe Minimal', 'Studio C', 'Aethel', 'Oversize Archive']}
          categories={['Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories']}
        />

        <ProductGrid
          activeSort={activeSort}
          activeFilters={activeFilters}
          query={isSearch ? searchQuery : undefined}
        />
      </div>
    </Layout>
  );
}

export default Shop;
