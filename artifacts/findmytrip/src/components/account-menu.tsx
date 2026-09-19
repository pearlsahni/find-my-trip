import { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { LogOut, Settings2, UserRound } from 'lucide-react';
import { Show, useClerk, useUser } from '@clerk/react';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function SignedInMenu() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const label = user?.firstName || user?.primaryEmailAddress?.emailAddress || 'Traveler';
  const initials = (user?.firstName?.[0] || user?.primaryEmailAddress?.emailAddress?.[0] || 'T').toUpperCase();

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="Open account menu" className="grid h-10 w-10 place-items-center rounded-full bg-[#173b3b] text-xs font-extrabold text-white ring-offset-2 transition hover:bg-[#255252] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF9F1C]" data-testid="button-profile">
        {user?.imageUrl ? <img src={user.imageUrl} alt="" className="h-full w-full rounded-full object-cover" /> : initials}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-[#e6dfd6] bg-white p-2 shadow-xl" role="menu">
          <div className="border-b border-[#f0ede6] px-3 py-3">
            <p className="truncate text-sm font-bold text-[#283341]">{label}</p>
            <p className="mt-0.5 text-xs text-[#68717c]">Your preferences sync here</p>
          </div>
          <Link href="/onboarding" onClick={() => setOpen(false)} className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#46515e] hover:bg-[#f8f6f1]" role="menuitem">
            <Settings2 size={17} /> Edit travel preferences
          </Link>
          <button type="button" onClick={() => signOut({ redirectUrl: basePath || '/' })} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#b34a35] hover:bg-[#fff4ef]" role="menuitem">
            <LogOut size={17} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function AccountMenu() {
  return (
    <>
      <Show when="signed-in"><SignedInMenu /></Show>
      <Show when="signed-out">
        <Link href="/sign-in" className="inline-flex items-center gap-2 rounded-full border border-[#e3ddd3] bg-[#fffdf8] px-4 py-2 text-sm font-bold text-[#46515e] hover:border-[#FF9F1C] hover:text-[#b76400]">
          <UserRound size={16} /> Sign in
        </Link>
      </Show>
    </>
  );
}