import './fonts.css';
import img_clikclak_descent_smooth2 from './images/clikclak-descent-smooth2.png';
import img_clikclak_hero_right from './images/clikclak-hero-right.png';
import { ClikClakShop } from "./_ClikClakShop";

export default function ClikClakDuskMix() {
  return (
    <div className="clikclak-dusk-mix">
      <style>{`
        .clikclak-dusk-mix {
          --mix-ink: #171d38;
          --mix-indigo: #242844;
          --mix-slate: #6d7187;
          --mix-amber: #b77e69;
          --mix-peach: #e5ad91;
          --mix-ivory: #f7f5f0;
        }
        .clikclak-dusk-mix > main {
          background: #f8f7f4 !important;
          color: #292824 !important;
        }
        /* Story photo: smooth, freshly paved descent (no cracks/potholes). */
        .clikclak-dusk-mix > main > section#story img {
          content: url(${img_clikclak_descent_smooth2});
        }
        /* Hero photo: rider sits in the right third so the headline and CTAs don't cover her. */
        .clikclak-dusk-mix > main > section:first-of-type > img {
          content: url(${img_clikclak_hero_right});
          object-position: center;
        }
        /* Typography: loosen the hero's tight tracking so italic glyphs (e.g. "fi" in "first") don't collide. */
        .clikclak-dusk-mix > main h1 {
          letter-spacing: -0.03em !important;
          font-variant-ligatures: no-common-ligatures;
        }
        .clikclak-dusk-mix > main h1 em {
          letter-spacing: -0.01em;
          padding-right: 0.06em;
        }
        /* The warm dusk accent is intentionally quiet: it appears as a thread through the light page. */
        .clikclak-dusk-mix > main > div:first-of-type {
          background: var(--mix-ink) !important;
          color: var(--mix-peach) !important;
        }
        .clikclak-dusk-mix > main > header {
          background: #f8f7f4 !important;
          border-color: rgba(41,40,36,.16) !important;
        }
        .clikclak-dusk-mix > main > header a:hover,
        .clikclak-dusk-mix > main > header button:hover,
        .clikclak-dusk-mix > main > footer a:hover {
          color: var(--mix-amber) !important;
        }
        .clikclak-dusk-mix > main > section#shop {
          background: #f1f0ed !important;
        }
        .clikclak-dusk-mix > main > section#shop > div:first-child button {
          color: var(--mix-slate) !important;
        }
        .clikclak-dusk-mix > main > section#shop > div:first-child button.text-\[\#b96d5d\] {
          color: var(--mix-amber) !important;
          border-color: var(--mix-amber) !important;
        }
        /* Keep the daylight campaign image, but give the editorial statement a dusk ink band. */
        .clikclak-dusk-mix > main > section#story {
          background: var(--mix-ink) !important;
          color: var(--mix-ivory) !important;
        }
        .clikclak-dusk-mix > main > section#story p.text-\[\#b8c1b9\] {
          color: #c1c3cd !important;
        }
        .clikclak-dusk-mix > main > section#story p.text-\[\#d8ded8\] {
          color: #e1e0dc !important;
        }
        .clikclak-dusk-mix > main > section#story p.text-\[\#e0a190\],
        .clikclak-dusk-mix > main > section#story span {
          color: var(--mix-peach) !important;
        }
        .clikclak-dusk-mix > main > section#journal {
          background: #ebece8 !important;
        }
        .clikclak-dusk-mix > main > section#journal article:nth-child(2) {
          background: var(--mix-indigo) !important;
          color: var(--mix-ivory) !important;
        }
        .clikclak-dusk-mix > main > section#journal article:nth-child(2) p,
        .clikclak-dusk-mix > main > section#journal article:nth-child(2) a {
          color: var(--mix-peach) !important;
        }
        .clikclak-dusk-mix > main > footer {
          background: var(--mix-ink) !important;
          color: var(--mix-ivory) !important;
          border-color: rgba(245,241,233,.2) !important;
        }
        .clikclak-dusk-mix > main > footer p,
        .clikclak-dusk-mix > main > footer div:last-child {
          color: #b7bac8 !important;
        }
        .clikclak-dusk-mix > main > footer input {
          color: var(--mix-ivory) !important;
        }
        .clikclak-dusk-mix > main > footer input::placeholder {
          color: #aeb0c0 !important;
        }
        .clikclak-dusk-mix > main > footer > div:first-child {
          border-color: rgba(245,241,233,.2) !important;
        }
        .clikclak-dusk-mix > main > footer a,
        .clikclak-dusk-mix > main > footer button {
          color: var(--mix-ivory) !important;
        }
        .clikclak-dusk-mix > main > footer a:first-child {
          color: var(--mix-ivory) !important;
        }
      `}</style>
      <ClikClakShop />
    </div>
  );
}

