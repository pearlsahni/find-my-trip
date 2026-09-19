import { Compass } from 'lucide-react';
import { Link } from 'wouter';

export function BrandLogo({ inverse = false, testId = 'link-home' }: { inverse?: boolean; testId?: string }) {
  return (
    <Link
      href="/"
      className={`group inline-flex items-center gap-2.5 rounded-md text-[18px] font-semibold tracking-[-0.06em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ed704f] focus-visible:ring-offset-2 ${inverse ? 'text-white focus-visible:ring-offset-[#1F67D4]' : 'text-[#25333d] focus-visible:ring-offset-[#f8f6f1]'}`}
      data-testid={testId}
      aria-label="FindMyTrip home"
    >
      <span className="grid h-9 w-9 place-items-center rounded-[12px] bg-[#ed704f] text-[#fffaf2] shadow-[0_6px_14px_rgba(194,79,50,.18)] transition-transform duration-300 group-hover:-rotate-6">
        <Compass size={19} strokeWidth={2.2} />
      </span>
      <span>findmytrip</span>
    </Link>
  );
}