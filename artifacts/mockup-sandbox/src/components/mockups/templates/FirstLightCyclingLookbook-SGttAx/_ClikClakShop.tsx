import img_clikclak_product_jersey_sage from './images/clikclak-product-jersey-sage.png';
import img_clikclak_product_bib_black from './images/clikclak-product-bib-black.png';
import img_clikclak_product_jacket_fog from './images/clikclak-product-jacket-fog.png';
import img_clikclak_product_baselayer_cream from './images/clikclak-product-baselayer-cream.png';
import img_clikclak_product_jersey_rust from './images/clikclak-product-jersey-rust.png';
import img_clikclak_product_vest_dawn from './images/clikclak-product-vest-dawn.png';
import img_clikclak_product_socks from './images/clikclak-product-socks.png';
import img_clikclak_product_cap from './images/clikclak-product-cap.png';
import img_clikclak_hero from './images/clikclak-hero.png';
import img_clikclak_descent from './images/clikclak-descent.png';
import img_clikclak_coffee from './images/clikclak-coffee.png';
import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ChevronDown,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  X,
} from "lucide-react";

type Product = {
  name: string;
  type: string;
  price: string;
  color: string;
  image: string;
  badge?: string;
};

const products: Product[] = [
  { name: "The First Light Jersey", type: "Short sleeve jersey", price: "$168", color: "Sage / Dawn pink", image: img_clikclak_product_jersey_sage, badge: "Best seller" },
  { name: "The Long Haul Bib", type: "High-rise bib short", price: "$198", color: "Black / Dawn pink", image: img_clikclak_product_bib_black },
  { name: "The Marin Shell", type: "Packable wind jacket", price: "$228", color: "Fog grey", image: img_clikclak_product_jacket_fog, badge: "New" },
  { name: "The Understory", type: "Merino blend base layer", price: "$112", color: "Warm cream", image: img_clikclak_product_baselayer_cream },
  { name: "The Afterglow Thermal", type: "Long sleeve jersey", price: "$188", color: "Redwood rust", image: img_clikclak_product_jersey_rust },
  { name: "The Golden Hour Gilet", type: "Insulated gilet", price: "$218", color: "Dawn pink", image: img_clikclak_product_vest_dawn, badge: "Limited run" },
  { name: "The Everyday Pair", type: "Merino cycling socks", price: "$32", color: "Sage / Cream", image: img_clikclak_product_socks },
  { name: "The Ridgetop Cap", type: "Five-panel cycling cap", price: "$42", color: "Cream / Redwood", image: img_clikclak_product_cap },
];

const categories = ["All pieces", "Jerseys", "Bib shorts", "Layers", "Accessories"];

export function ClikClakShop() {
  const [cartCount, setCartCount] = useState(0);
  const [activeCategory, setActiveCategory] = useState("All pieces");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [notice, setNotice] = useState("");

  const filteredProducts = useMemo(() => {
    if (activeCategory === "All pieces") return products;
    return products.filter((product) => {
      if (activeCategory === "Jerseys") return product.type.toLowerCase().includes("jersey");
      if (activeCategory === "Bib shorts") return product.type.toLowerCase().includes("bib");
      if (activeCategory === "Layers") return product.type.toLowerCase().includes("layer") || product.type.toLowerCase().includes("jacket") || product.type.toLowerCase().includes("gilet");
      return product.type.toLowerCase().includes("sock") || product.type.toLowerCase().includes("cap");
    });
  }, [activeCategory]);

  const addToCart = (name: string) => {
    setCartCount((count) => count + 1);
    setNotice(`${name} added to your kit`);
    window.setTimeout(() => setNotice(""), 2400);
  };

  const toggleFavorite = (name: string) => {
    setFavorites((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);
  };

  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-[#f4f0e9] text-[#26352e]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        main { background: #f8f7f4 !important; color: #292824 !important; font-family: 'DM Sans', sans-serif !important; }
        main h1, main h2, main h3 { font-family: 'Playfair Display', 'Libre Baskerville', serif !important; font-weight: 400 !important; letter-spacing: -0.055em !important; }
        main header, main footer { background: #f8f7f4 !important; }
        main header { border-color: rgba(41,40,36,.16) !important; }
        main [class*="bg-[#d99888]"] { background: #e8e3dc !important; color: #292824 !important; }
        main [class*="bg-[#f4f0e9]"] { background: #f8f7f4 !important; color: #292824 !important; }
        main [class*="bg-[#e8e3d9]"] { background: #f1f0ed !important; }
        main [class*="bg-[#d5dfd1]"] { background: #ebece8 !important; }
        main [class*="bg-[#26352e]"] { background: #292824 !important; color: #f8f7f4 !important; }
        main [class*="text-[#26352e]"] { color: #292824 !important; }
        main [class*="text-[#f4f0e9]"] { color: #f8f7f4 !important; }
        main [class*="text-[#f6f1e9]"] { color: #f8f7f4 !important; }
        main [class*="text-[#e0a190]"], main [class*="text-[#f2c7ae]"], main [class*="text-[#b96d5d]"], main [class*="text-[#c67d6c]"] { color: #807e78 !important; }
        main [class*="border-[#26352e]"] { border-color: rgba(41,40,36,.22) !important; }
        main [class*="border-[#e0a190]"] { border-color: #aaa8a2 !important; }
        main [class*="bg-[#ebe6dc]"] { background: #eeede9 !important; }
        main button, main a { transition: color .25s ease, background-color .25s ease, border-color .25s ease, transform .35s ease !important; }
        main header a, main header button, main footer a { letter-spacing: .13em !important; font-size: 10px !important; text-transform: uppercase !important; }
        main header > div:first-child > a { text-transform: lowercase !important; letter-spacing: -.09em !important; font-size: 19px !important; }
        main nav a:hover, main header button:hover, main footer a:hover { color: #77746e !important; }
        main section#shop button { color: #77746e; }
        main section#shop button.text-[#b96d5d] { color: #292824 !important; border-bottom: 1px solid #292824; padding-bottom: 3px; }
        main article button[class*="bg-[#26352e]"] { background: rgba(41,40,36,.94) !important; }
        main article button[class*="bg-[#26352e]"]:hover { background: #55534e !important; }
        main input { color: #292824 !important; }
        main input::placeholder { color: #85827b !important; }
        main .group:hover img { transform: scale(1.02) !important; }
        @media (max-width: 767px) {
          main h1 { font-size: clamp(3.1rem, 15vw, 5.5rem) !important; }
          main header { height: 66px !important; }
        }
      `}</style>
      {notice && (
        <div className="fixed right-5 top-5 z-50 flex items-center gap-3 bg-[#26352e] px-5 py-4 text-xs font-medium tracking-[0.08em] text-[#f4f0e9] shadow-xl">
          <span className="h-2 w-2 rounded-full bg-[#e0a190]" /> {notice}
        </div>
      )}
      <div className="bg-[#d99888] px-4 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-[#26352e]">
        Complimentary shipping on orders over $175 · built for the long way home
      </div>
      <header className="relative z-30 flex h-[76px] items-center justify-between border-b border-[#26352e]/15 px-5 md:px-10">
        <div className="flex items-center gap-8">
          <button className="md:hidden" aria-label="Open menu" onClick={() => setMobileOpen(true)}><Menu size={21} strokeWidth={1.5} /></button>
          <a href="#shop" className="text-[19px] font-semibold tracking-[-0.09em]">clik<span className="text-[#c67d6c]">clak</span><span className="ml-1 text-[9px] align-top tracking-[0.12em]">®</span></a>
          <nav className="hidden items-center gap-7 text-[11px] font-medium uppercase tracking-[0.13em] md:flex">
            <a href="#shop" className="hover:text-[#b96d5d]">Shop</a>
            <a href="#story" className="hover:text-[#b96d5d]">The ride</a>
            <a href="#journal" className="hover:text-[#b96d5d]">Journal</a>
          </nav>
        </div>
        <div className="flex items-center gap-5">
          <button aria-label="Search" className="hidden md:block"><Search size={18} strokeWidth={1.5} /></button>
          <button aria-label="Favorites" className="hidden md:block"><Heart size={18} strokeWidth={1.5} /></button>
          <button aria-label="Shopping bag" className="relative" onClick={() => setNotice(cartCount ? `${cartCount} piece${cartCount === 1 ? "" : "s"} in your bag` : "Your bag is waiting for a first piece")}>
            <ShoppingBag size={19} strokeWidth={1.5} />
            {cartCount > 0 && <span className="absolute -right-3 -top-3 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c67d6c] px-1 text-[9px] text-[#f4f0e9]">{cartCount}</span>}
          </button>
        </div>
      </header>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-[#26352e] p-6 text-[#f4f0e9] md:hidden">
          <div className="flex justify-between"><span className="text-lg font-semibold tracking-[-0.08em]">clik<span className="text-[#e0a190]">clak</span></span><button onClick={() => setMobileOpen(false)} aria-label="Close menu"><X /></button></div>
          <nav className="mt-24 flex flex-col gap-6 text-3xl" style={{ fontFamily: "'Libre Baskerville', serif" }}>
            <a href="#shop" onClick={() => setMobileOpen(false)}>Shop</a><a href="#story" onClick={() => setMobileOpen(false)}>The ride</a><a href="#journal" onClick={() => setMobileOpen(false)}>Journal</a>
          </nav>
        </div>
      )}
      <section className="relative min-h-[600px] overflow-hidden md:min-h-[680px]">
        <img src={img_clikclak_hero} alt="Cyclist climbing through Marin hills at dawn" className="absolute inset-0 h-full w-full object-cover object-[58%_center]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#26352e]/70 via-[#26352e]/15 to-transparent" />
        <div className="relative flex min-h-[600px] flex-col justify-end px-6 pb-12 text-[#f6f1e9] md:min-h-[680px] md:px-12 md:pb-16">
          <h1 className="max-w-[720px] text-[clamp(3.5rem,9vw,8rem)] leading-[0.88] tracking-[-0.075em]" style={{ fontFamily: "'Libre Baskerville', serif" }}>Made for<br /><em>the first light.</em></h1>
          <div className="mt-8 flex items-center gap-5">
            <a href="#shop" className="group flex items-center gap-4 bg-[#f4f0e9] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#26352e]">Shop the collection <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></a>
            <a href="#story" className="hidden text-[11px] font-semibold uppercase tracking-[0.16em] text-[#f4f0e9] md:block">Our point of view <ArrowDownRight size={15} className="ml-1 inline" /></a>
          </div>
        </div>
      </section>
      <section id="shop" className="px-5 py-16 md:px-10 md:py-24 pt-[60px] pb-[60px]">
        <div className="mb-10 flex flex-col justify-between gap-7 md:flex-row md:items-end">
          <div><p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#b96d5d]">The collection</p><h2 className="text-4xl tracking-[-0.06em] md:text-6xl" style={{ fontFamily: "'Libre Baskerville', serif" }}>Your ride,<br /><em>your rhythm.</em></h2></div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 border-b border-[#26352e]/20 pb-3 text-[10px] font-semibold uppercase tracking-[0.13em]">
            {categories.map((category) => <button key={category} onClick={() => setActiveCategory(category)} className={activeCategory === category ? "text-[#b96d5d]" : "text-[#68766d] hover:text-[#26352e]"}>{category}</button>)}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-12 md:grid-cols-4 md:gap-x-5 md:gap-y-16">
          {filteredProducts.map((product) => <ProductCard key={product.name} product={product} isFavorite={favorites.includes(product.name)} onFavorite={() => toggleFavorite(product.name)} onAdd={() => addToCart(product.name)} />)}
        </div>
      </section>
      <section id="story" className="grid bg-[#26352e] text-[#f4f0e9] md:grid-cols-[1.2fr_0.8fr]">
        <div className="relative min-h-[470px] overflow-hidden md:min-h-[620px]"><img src={img_clikclak_descent} alt="Cyclist descending through sage hills" className="h-full w-full object-cover opacity-90" /><span className="absolute bottom-6 left-6 text-[9px] uppercase tracking-[0.2em] text-[#f2c7ae]">Mt. Tam / 07:04</span></div>
        <div className="flex items-center px-7 py-16 md:px-16"><div className="max-w-[360px]"><p className="mb-7 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#e0a190]">The ClikClak standard</p><h2 className="text-4xl leading-[1.06] tracking-[-0.05em] md:text-5xl" style={{ fontFamily: "'Libre Baskerville', serif" }}>The best kit<br /><em>disappears.</em></h2><p className="mt-8 text-[14px] leading-7 text-[#b8c1b9]">No tugging. No chafing. No thinking about your clothes when you should be thinking about the road. Every panel, pocket, and seam earns its place.</p><p className="mt-8 border-l border-[#e0a190] pl-5 text-[13px] italic leading-6 text-[#d8ded8]">“I wanted the pieces I reached for on a Tuesday to feel as special as a race-day kit.”<br /><span className="not-italic text-[10px] uppercase tracking-[0.16em] text-[#e0a190]">— Annie, founder</span></p></div></div>
      </section>
      <section id="journal" className="bg-[#d5dfd1] px-5 py-16 md:px-10 md:py-24">
        <div className="mb-10 flex items-end justify-between"><div><p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#b96d5d]">From the journal</p><h2 className="text-4xl tracking-[-0.06em] md:text-5xl" style={{ fontFamily: "'Libre Baskerville', serif" }}>Out there, together.</h2></div><a href="#journal" className="hidden items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] md:flex">Read all <ArrowRight size={15} /></a></div>
        <div className="grid gap-5 md:grid-cols-[1.3fr_0.7fr_0.7fr]">
          <article className="group relative min-h-[380px] overflow-hidden"><img src={img_clikclak_coffee} alt="Cyclists sharing coffee after a ride" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-[#26352e]/80 to-transparent" /><div className="absolute bottom-6 left-6 text-[#f4f0e9]"><p className="mb-2 text-[9px] uppercase tracking-[0.2em] text-[#f2c7ae]">Field notes · 08.17.24</p><h3 className="text-2xl leading-tight" style={{ fontFamily: "'Libre Baskerville', serif" }}>A good ride ends<br />where the coffee starts.</h3></div></article>
          <article className="bg-[#f4f0e9] p-6"><p className="text-[9px] uppercase tracking-[0.2em] text-[#b96d5d]">Route guide no. 03</p><h3 className="mt-20 text-3xl leading-tight tracking-[-0.05em]" style={{ fontFamily: "'Libre Baskerville', serif" }}>The long way<br /><em>to Point Reyes.</em></h3><a href="#journal" className="mt-16 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em]">Read route <ArrowRight size={14} /></a></article>
          <article className="border border-[#26352e]/20 p-6"><p className="text-[9px] uppercase tracking-[0.2em] text-[#b96d5d]">Club ClikClak</p><h3 className="mt-20 text-3xl leading-tight tracking-[-0.05em]" style={{ fontFamily: "'Libre Baskerville', serif" }}>Meet us at<br /><em>first light.</em></h3><p className="mt-8 text-[12px] leading-5 text-[#68766d]">Weekly rides, occasional pastries, always a tailwind home.</p><a href="#journal" className="mt-8 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em]">Join the club <ArrowRight size={14} /></a></article>
        </div>
      </section>
      <footer className="bg-[#e8e3d9] px-5 py-12 md:px-10 md:py-16"><div className="flex flex-col justify-between gap-10 border-b border-[#26352e]/20 pb-12 md:flex-row"><div><a href="#shop" className="text-2xl font-semibold tracking-[-0.1em]">clik<span className="text-[#c67d6c]">clak</span></a><p className="mt-4 max-w-[230px] text-[12px] leading-5 text-[#68766d]">For women who prefer cleats to heels. Designed in California. Made for everywhere.</p></div><div className="grid grid-cols-2 gap-x-14 gap-y-3 text-[10px] font-semibold uppercase tracking-[0.14em]"><a href="#shop">Shop all</a><a href="#story">Our story</a><a href="#journal">Journal</a><a href="#shop">Size guide</a><a href="#shop">Shipping</a><a href="#shop">Contact</a></div><div className="max-w-[280px]"><p className="text-[10px] font-semibold uppercase tracking-[0.14em]">Notes from the road</p><p className="mt-3 text-[12px] leading-5 text-[#68766d]">New routes, new pieces, no inbox clutter. Just the good stuff.</p><div className="mt-4 flex border-b border-[#26352e] pb-2"><input aria-label="Email address" placeholder="Your email address" className="w-full bg-transparent text-xs outline-none placeholder:text-[#68766d]" /><button aria-label="Subscribe"><ArrowRight size={16} /></button></div></div></div><div className="flex justify-between pt-6 text-[9px] uppercase tracking-[0.16em] text-[#68766d]"><span>© 2025 ClikClak Cycling Co.</span><span>Made for the long way home</span></div></footer>
    </main>
  );
}

function ProductCard({ product, isFavorite, onFavorite, onAdd }: { product: Product; isFavorite: boolean; onFavorite: () => void; onAdd: () => void }) {
  return (
    <article className="group relative">
      <div className="relative aspect-[0.82] overflow-hidden bg-[#ebe6dc]">
        <img src={product.image} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]" />
        {product.badge && <span className="absolute left-3 top-3 bg-[#f4f0e9] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.14em]">{product.badge}</span>}
        <button onClick={onFavorite} aria-label={`Favorite ${product.name}`} className="absolute right-3 top-3"><Heart size={18} strokeWidth={1.4} fill={isFavorite ? "#c67d6c" : "none"} color={isFavorite ? "#c67d6c" : "#26352e"} /></button>
        <button onClick={onAdd} className="absolute bottom-0 left-0 right-0 translate-y-full bg-[#26352e] py-3 text-[10px] font-semibold uppercase tracking-[0.17em] text-[#f4f0e9] transition-transform duration-300 group-hover:translate-y-0">Quick add <span className="ml-2 text-[#e0a190]">+</span></button>
      </div>
      <div className="flex justify-between gap-2 pt-3"><div><h3 className="text-[13px] font-semibold tracking-[-0.02em]">{product.name}</h3><p className="mt-1 text-[11px] text-[#68766d]">{product.type} · {product.color}</p></div><span className="text-[12px] font-medium">{product.price}</span></div>
    </article>
  );
}

export default ClikClakShop;