import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Seo from '../components/Seo';
import CinematicHero from '../components/hero/CinematicHero';
import ProductGrid from '../components/products/ProductGrid';
import CategoryFilter from '../components/products/CategoryFilter';

// SVGs for the story section
const Icons = {
  Fabric: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
      <line x1="16" y1="8" x2="2" y2="22"></line>
      <line x1="17.5" y1="15" x2="9" y2="6.5"></line>
    </svg>
  ),
  Design: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
    </svg>
  )
};

function Home() {
  const [category, setCategory] = useState('all');

  return (
    <Layout>
      <Seo
        title="LuxeFashion"
        description="Premium everyday clothing — modern essentials in premium fabrics, ethically sourced. Free worldwide shipping and 30-day returns."
        path="/"
      />
      
      <CinematicHero />

      {/* Trust Signals Marquee (Micro-banner) */}
      <div className="border-b border-border bg-surface py-3 overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee gap-16 font-body text-xs uppercase tracking-widest text-ink items-center">
          {/* Double the content for seamless infinite looping */}
          {[...Array(6)].map((_, i) => (
            <span key={i} className="flex gap-16 items-center">
              <span>Free Worldwide Shipping</span>
              <span className="w-1.5 h-1.5 rounded-full bg-ink"></span>
              <span>30-Day Easy Returns</span>
              <span className="w-1.5 h-1.5 rounded-full bg-ink"></span>
              <span>Ethically Sourced</span>
              <span className="w-1.5 h-1.5 rounded-full bg-ink"></span>
            </span>
          ))}
        </div>
      </div>

      {/* Collections section */}
      <section id="collections" className="max-w-7xl mx-auto px-8 py-24 scroll-mt-20">
        <div className="mb-14 text-center">
          <h2 className="text-4xl md:text-5xl text-ink font-display">
            Featured Collections
          </h2>
        </div>
        <CategoryFilter selected={category} onSelect={setCategory} />
        <ProductGrid activeFilters={{ brands: [], categories: category === 'all' ? [] : [category] }} />
      </section>

      {/* Story section (Editorial Redesign) */}
      <section id="story" className="border-t border-border scroll-mt-20 bg-surface">
        <div className="max-w-7xl mx-auto px-8 py-32 flex flex-col md:flex-row gap-20 items-center">
          <div className="flex-1">
            <h2 className="text-4xl md:text-5xl lg:text-6xl text-ink mb-8 leading-tight font-display">
              Designed for{' '}
              <em className="text-muted italic">everyday luxury.</em>
            </h2>
            <p className="text-muted leading-relaxed mb-10 text-lg font-body max-w-xl">
              LuxeFashion curates modern essentials with premium fabrics, clean
              silhouettes, and a reliable fit across every season. We believe
              clothing should feel as good as it looks.
            </p>
            <div className="flex flex-col sm:flex-row gap-8 font-body mb-10">
              <div className="flex flex-col gap-3">
                <div className="text-ink">{Icons.Fabric}</div>
                <h3 className="text-sm font-medium text-ink">Premium Fabrics</h3>
                <p className="text-xs text-muted leading-relaxed max-w-[200px]">Only the finest materials, ethically sourced from sustainable mills.</p>
              </div>
              <div className="flex flex-col gap-3">
                <div className="text-ink">{Icons.Design}</div>
                <h3 className="text-sm font-medium text-ink">Timeless Design</h3>
                <p className="text-xs text-muted leading-relaxed max-w-[200px]">Silhouettes that transcend seasonal trends, built to last a lifetime.</p>
              </div>
            </div>
            <Link to="/shop" className="btn-primary">
              Shop the Collection
            </Link>
          </div>
          
          <div className="flex-1 w-full relative mt-12 md:mt-0">
            {/* Editorial imagery stack */}
            <div className="aspect-[4/5] bg-border rounded-2xl overflow-hidden relative w-[85%] md:w-[80%] ml-auto shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=800&auto=format&fit=crop"
                alt="Fabric detail"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="aspect-square bg-border rounded-2xl overflow-hidden absolute bottom-[-8%] left-0 w-[48%] md:w-[45%] shadow-xl border-4 border-surface">
              <img
                src="https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=800&auto=format&fit=crop"
                alt="Shirt detail"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

export default Home;
