import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@clerk/react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetTravelerProfileQueryKey, useGetTravelerProfile, useUpdateTravelerPreferences } from '@workspace/api-client-react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Compass,
  Heart,
  House,
  IndianRupee,
  Leaf,
  MapPin,
  Mountain,
  Salad,
  Sparkles,
  Sunrise,
  UserRound,
  UsersRound,
  Utensils,
  Waves,
  Zap,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import {
  emptyPreferences,
  clearLocalPreferences,
  normalizePreferences,
  PREFERENCES_COMPLETE_KEY as COMPLETE_KEY,
  PREFERENCES_KEY as STORAGE_KEY,
  readAccountPreferences,
  writeAccountPreferences,
  type PreferenceStep as StepKey,
  type TravelerPreferences as Draft,
} from '@/lib/traveler-preferences';

const steps: { key: StepKey; label: string }[] = [
  { key: 'vibes', label: 'Trip vibes' },
  { key: 'companions', label: 'Who you’re with' },
  { key: 'interests', label: 'What pulls you' },
  { key: 'budget', label: 'Trip budget' },
  { key: 'diet', label: 'Food preferences' },
];

const vibeOptions: { value: string; label: string; description: string; icon: LucideIcon }[] = [
  { value: 'hippie', label: 'Hippie', description: 'Barefoot days and free-spirited finds', icon: Sunrise },
  { value: 'bougie', label: 'Bougie', description: 'Beautiful stays and the best tables', icon: Sparkles },
  { value: 'offbeat', label: 'Offbeat', description: 'Side streets and unexpected stories', icon: Compass },
  { value: 'easygoing', label: 'Easygoing', description: 'Slow mornings and room to wander', icon: Waves },
  { value: 'high-energy', label: 'High-energy', description: 'Big days, bright nights, no dull bits', icon: Zap },
  { value: 'romantic', label: 'Romantic', description: 'Scenic moments worth sharing', icon: Leaf },
];

const companionOptions: { value: string; label: string; description: string; icon: LucideIcon }[] = [
  { value: 'solo', label: 'Solo', description: 'Just me, moving at my own pace', icon: UserRound },
  { value: 'couple', label: 'Couple', description: 'A trip for two', icon: Heart },
  { value: 'family', label: 'Family', description: 'Comfort and fun for everyone', icon: House },
  { value: 'friends', label: 'Friends', description: 'Shared plans and great stories', icon: UsersRound },
];

const interestOptions: { value: string; label: string; description: string; icon: LucideIcon }[] = [
  { value: 'food', label: 'Food trails', description: 'Markets, kitchens, long lunches', icon: Utensils },
  { value: 'culture', label: 'Culture & history', description: 'Stories in every street', icon: Sunrise },
  { value: 'nature', label: 'Nature', description: 'Open skies and slower days', icon: Mountain },
  { value: 'beaches', label: 'Beaches', description: 'Salt air, no schedule', icon: Waves },
  { value: 'wellness', label: 'Wellness', description: 'A reset that goes somewhere', icon: Leaf },
  { value: 'nightlife', label: 'Nightlife', description: 'Stay out a little later', icon: Sparkles },
  { value: 'adventure', label: 'Adventure', description: 'A story worth retelling', icon: Compass },
  { value: 'shopping', label: 'Shopping', description: 'Bring home the good stuff', icon: IndianRupee },
];

const budgetOptions = [
  { value: 'under-50k', label: 'Under ₹50,000', detail: 'Smart choices, big experiences' },
  { value: '50k-1l', label: '₹50,000 – ₹1,00,000', detail: 'A balanced way to roam' },
  { value: '1l-3l', label: '₹1,00,000 – ₹3,00,000', detail: 'More room for the memorable bits' },
  { value: '3l-5l', label: '₹3,00,000 – ₹5,00,000', detail: 'More comfort, fewer compromises' },
  { value: 'open', label: 'I’m open to it all', detail: 'Show me the right trip first' },
];

const dietOptions: { value: string; label: string; description: string; icon: LucideIcon }[] = [
  { value: 'vegetarian', label: 'Vegetarian', description: 'Plant-forward by default', icon: Leaf },
  { value: 'vegan', label: 'Vegan', description: 'Fully plant-based', icon: Salad },
  { value: 'no-preference', label: 'Good with everything', description: 'No dietary restrictions', icon: Utensils },
];

const emptyDraft: Draft = emptyPreferences;

function readDraft(): Draft {
  if (typeof window === 'undefined') return emptyDraft;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return emptyDraft;
    const parsed = JSON.parse(saved) as Partial<Draft>;
    return {
      ...emptyDraft,
      ...parsed,
      vibes: Array.isArray(parsed.vibes) ? parsed.vibes : [],
      interests: Array.isArray(parsed.interests) ? parsed.interests : [],
      diet: Array.isArray(parsed.diet) ? parsed.diet : [],
      skipped: parsed.skipped ?? {},
    };
  } catch {
    return emptyDraft;
  }
}

function displayValue(value: string, options: { value: string; label: string }[]) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function Onboarding() {
  const { isSignedIn, userId } = useAuth();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft>(readDraft);
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(COMPLETE_KEY) === 'true';
  });
  const profileQueryKey = useMemo(() => [...getGetTravelerProfileQueryKey(), userId ?? 'signed-out'] as const, [userId]);
  const profile = useGetTravelerProfile({ query: { queryKey: profileQueryKey, enabled: Boolean(isSignedIn && userId), retry: false } });
  const saveProfile = useUpdateTravelerPreferences();
  const [hydratedUserId, setHydratedUserId] = useState<string | null>(null);
  const activeUserId = useRef<string | null>(userId ?? null);
  const lastSaved = useRef('');

  useEffect(() => {
    if (!isSignedIn) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    else if (userId && hydratedUserId === userId) writeAccountPreferences(userId, draft);
  }, [draft, hydratedUserId, isSignedIn, userId]);

  useEffect(() => {
    if (isSignedIn) return;
    if (completed) window.localStorage.setItem(COMPLETE_KEY, 'true');
    else window.localStorage.removeItem(COMPLETE_KEY);
  }, [completed, isSignedIn]);

  useEffect(() => {
    const nextUserId = isSignedIn ? userId ?? null : null;
    if (activeUserId.current === nextUserId) return;
    activeUserId.current = nextUserId;
    setHydratedUserId(null);
    lastSaved.current = '';
    if (nextUserId) {
      setDraft(emptyPreferences);
      setCompleted(false);
    }
  }, [isSignedIn, userId]);

  useEffect(() => {
    const savedProfile = profile.data;
    const currentUserId = savedProfile?.user_id;
    if (!isSignedIn || !profile.isSuccess || !currentUserId || currentUserId !== userId || hydratedUserId === currentUserId) return;
    if (savedProfile.preferences) {
      const normalized = normalizePreferences(savedProfile.preferences);
      setDraft(normalized);
      writeAccountPreferences(currentUserId, normalized);
      lastSaved.current = JSON.stringify(normalized);
      setCompleted(true);
    } else {
      const accountCache = readAccountPreferences(currentUserId);
      const anonymousCompleted = window.localStorage.getItem(COMPLETE_KEY) === 'true';
      if (accountCache) {
        setDraft(accountCache);
        setCompleted(true);
      } else if (anonymousCompleted) {
        setDraft(readDraft());
        setCompleted(true);
      } else {
        setDraft(emptyPreferences);
        setCompleted(false);
      }
    }
    setHydratedUserId(currentUserId);
  }, [hydratedUserId, isSignedIn, profile.data, profile.isSuccess, userId]);

  useEffect(() => {
    if (!isSignedIn || !userId || !profile.isSuccess || hydratedUserId !== userId || !completed) return;
    const serialized = JSON.stringify(draft);
    if (lastSaved.current === serialized) return;
    lastSaved.current = serialized;
    saveProfile.mutate(
      { data: draft },
      {
        onSuccess: (savedProfile) => {
          queryClient.setQueryData(profileQueryKey, savedProfile);
          const saved = savedProfile.preferences;
          if (saved) writeAccountPreferences(userId, normalizePreferences(saved));
          clearLocalPreferences();
        },
        onError: () => { lastSaved.current = ''; },
      },
    );
  }, [completed, draft, hydratedUserId, isSignedIn, profile.isSuccess, profileQueryKey, queryClient, userId]);

  const current = steps[currentStep];

  const chooseSingle = (key: 'companions' | 'budget', value: string) => {
    setDraft((previous) => ({
      ...previous,
      [key]: value,
      skipped: { ...previous.skipped, [key]: false },
    }));
  };

  const toggleMulti = (key: 'vibes' | 'interests' | 'diet', value: string) => {
    setDraft((previous) => {
      const existing = previous[key];
      if (key === 'interests' && !existing.includes(value) && existing.length >= 5) return previous;
      if (key === 'diet' && value === 'no-preference') {
        return { ...previous, diet: existing.includes(value) ? [] : [value], skipped: { ...previous.skipped, diet: false } };
      }
      const next = existing.includes(value) ? existing.filter((item) => item !== value) : [...existing, value];
      return { ...previous, [key]: next, skipped: { ...previous.skipped, [key]: false } };
    });
  };

  const hasAnswer = () => {
    if (current.key === 'vibes') return draft.vibes.length > 0;
    if (current.key === 'companions') return Boolean(draft.companions);
    if (current.key === 'interests') return draft.interests.length > 0;
    if (current.key === 'budget') return Boolean(draft.budget);
    return draft.diet.length > 0;
  };

  const moveNext = () => {
    if (!hasAnswer()) {
      setDraft((previous) => ({ ...previous, skipped: { ...previous.skipped, [current.key]: true } }));
    }
    if (currentStep === steps.length - 1) {
      setCompleted(true);
      return;
    }
    setCurrentStep((step) => step + 1);
  };

  const skipCurrent = () => {
    setDraft((previous) => ({ ...previous, skipped: { ...previous.skipped, [current.key]: true } }));
    if (currentStep === steps.length - 1) {
      setCompleted(true);
      return;
    }
    setCurrentStep((step) => step + 1);
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep((step) => step - 1);
    }
  };

  const restartReview = () => {
    setCompleted(false);
    setCurrentStep(0);
  };

  return (
    <main className="min-h-[100dvh] bg-white text-slate-900 selection:bg-[#FF9F1C]/30">
      <div className="mx-auto flex min-h-[100dvh] max-w-[1440px] flex-col lg:flex-row">
        <aside className="relative overflow-hidden bg-[#1F67D4] px-5 pb-7 pt-5 text-white lg:flex lg:w-[35%] lg:max-w-[500px] lg:flex-col lg:justify-between lg:px-10 lg:pb-10 lg:pt-9 xl:px-14">
          <div className="absolute -right-24 top-28 h-64 w-64 rounded-full border border-[#70E1E8]/35 bg-[#70E1E8]/10" />
          <div className="absolute -right-8 top-44 h-44 w-44 rounded-full border border-white/25" />
          <div className="absolute bottom-24 left-[-120px] h-64 w-64 rounded-full border border-[#FFB020]/25 bg-[#FFB020]/10" />
          <div className="relative z-10">
            <BrandLogo inverse testId="brand-findmytrip" />

            <div className="mt-9 max-w-[360px] lg:mt-20">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[.2em] text-[#FF9F1C]">A better way out</p>
              <h1 className="font-serif text-[2.2rem] font-extrabold leading-[1.05] tracking-tight sm:text-[2.6rem] lg:text-[3.4rem]">
                Start with a feeling. We’ll find the place.
              </h1>
              <p className="mt-5 max-w-[315px] text-sm leading-6 text-sky-100 lg:text-base font-medium">
                Five small choices help us turn a blank map into a trip that feels like yours.
              </p>
            </div>

          </div>

          <div className="relative z-10 mt-8 hidden lg:block">
            <div className="mb-8 flex items-center gap-3 text-xs text-sky-200">
              <span className="h-px w-8 bg-sky-200/50" />
              <span>Made for curious travellers from India</span>
            </div>
            <div className="space-y-5" aria-label="Onboarding progress">
              {steps.map((step, index) => {
                const isActive = index === currentStep && !completed;
                const isDone = index < currentStep || completed;
                return (
                  <div className="flex items-center gap-3" key={step.key}>
                    <span className={`grid h-7 w-7 place-items-center rounded-full border text-[11px] font-bold transition-colors ${isActive ? 'border-[#FF9F1C] bg-[#FF9F1C] text-slate-900' : isDone ? 'border-[#2EC4B6] bg-[#2EC4B6] text-slate-900' : 'border-sky-300/30 text-sky-200'}`}>
                      {isDone ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : `0${index + 1}`}
                    </span>
                    <span className={`text-sm transition-colors ${isActive ? 'font-bold text-white' : isDone ? 'text-sky-100' : 'text-sky-300/70'}`}>{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative z-10 mt-8 flex items-center justify-between lg:hidden">
            <span className="text-xs font-medium text-sky-200">Your trip, your way</span>
            <span className="text-xs font-bold text-[#FF9F1C]">{completed ? 'Ready' : `${currentStep + 1} / ${steps.length}`}</span>
          </div>
        </aside>

        <section className="flex min-h-0 flex-1 flex-col px-5 pb-7 pt-7 sm:px-8 lg:px-12 lg:pb-10 lg:pt-10 xl:px-20 bg-white">
          <header className="mx-auto flex w-full max-w-[760px] items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <MapPin className="h-4 w-4 text-[#1F67D4]" />
              <span>For outbound leisure travel</span>
            </div>
            {!completed && (
              <button
                type="button"
                onClick={skipCurrent}
                className="rounded-full px-3 py-2 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF9F1C]"
                data-testid="button-skip-top"
              >
                Skip for now
              </button>
            )}
          </header>

          {!completed ? (
            <div className="onboarding-enter mx-auto flex w-full max-w-[760px] flex-1 flex-col" key={current.key}>
              <div className="mt-8 lg:mt-12">
                <div className="mb-3 flex items-center justify-between text-[11px] font-bold uppercase tracking-[.16em] text-[#1F67D4]">
                  <span>Question {String(currentStep + 1).padStart(2, '0')} of {String(steps.length).padStart(2, '0')}</span>
                  <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="progress-fill h-full rounded-full bg-[#FF9F1C]" style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }} />
                </div>
              </div>

              <div className="mt-8 flex-1 lg:mt-12">
                {current.key === 'vibes' && <MultiStep eyebrow="YOUR TRIP ENERGY" title="What vibe are you chasing?" subtitle="Pick as many as feel right. Mix hippie with bougie — this trip is yours." options={vibeOptions} values={draft.vibes} onToggle={(value) => toggleMulti('vibes', value)} />}
                {current.key === 'companions' && <CompanionStep value={draft.companions} onSelect={(value) => chooseSingle('companions', value)} />}
                {current.key === 'interests' && <InterestsStep values={draft.interests} onToggle={(value) => toggleMulti('interests', value)} />}
                {current.key === 'budget' && <BudgetStep value={draft.budget} onSelect={(value) => chooseSingle('budget', value)} />}
                {current.key === 'diet' && <MultiStep eyebrow="AROUND THE TABLE" title="Anything we should know about food?" subtitle="Choose what makes a trip feel easy. This is always optional." options={dietOptions} values={draft.diet} onToggle={(value) => toggleMulti('diet', value)} />}
              </div>

              <footer className="mt-10 flex items-center justify-between border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={goBack}
                  disabled={currentStep === 0}
                  className="inline-flex items-center gap-2 rounded-full px-2 py-3 text-sm font-bold text-slate-500 transition-colors hover:text-slate-900 disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF9F1C]"
                  data-testid="button-back"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={skipCurrent}
                    className="hidden rounded-full px-2 py-3 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900 sm:block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF9F1C]"
                    data-testid="button-skip-bottom"
                  >
                    Skip
                  </button>
                  <button
                    type="button"
                    onClick={moveNext}
                    className="group inline-flex items-center gap-3 rounded-full bg-[#FF9F1C] px-6 py-3 text-sm font-bold text-slate-900 shadow-lg shadow-[#FF9F1C]/25 transition-all hover:-translate-y-0.5 hover:bg-[#F39200] hover:shadow-xl hover:shadow-[#FF9F1C]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF9F1C] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    data-testid="button-continue"
                  >
                    {currentStep === steps.length - 1 ? 'See my starting point' : 'Continue'}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              </footer>
            </div>
          ) : (
            <CompletionState
              draft={draft}
              onEdit={restartReview}
              syncState={!isSignedIn ? 'local' : saveProfile.isPending ? 'saving' : saveProfile.isError ? 'error' : 'synced'}
            />
          )}
        </section>
      </div>
    </main>
  );
}

function StepHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="max-w-[600px]">
      <p className="mb-3 text-[11px] font-bold uppercase tracking-[.18em] text-[#1F67D4]">{eyebrow}</p>
      <h2 className="font-serif text-[2rem] font-extrabold leading-[1.08] tracking-[-.045em] text-slate-900 sm:text-[2.6rem]">{title}</h2>
      <p className="mt-4 max-w-[530px] text-sm leading-6 text-slate-600 sm:text-base font-medium">{subtitle}</p>
    </div>
  );
}

function MultiStep({ eyebrow, title, subtitle, options, values, onToggle }: { eyebrow: string; title: string; subtitle: string; options: { value: string; label: string; description: string; icon: LucideIcon }[]; values: string[]; onToggle: (value: string) => void }) {
  return (
    <div>
      <StepHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <div className="mt-8 grid max-w-[670px] grid-cols-1 gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const selected = values.includes(option.value);
          const Icon = option.icon;
          return (
            <button
              type="button"
              key={option.value}
              onClick={() => onToggle(option.value)}
              aria-pressed={selected}
              className={`group relative flex min-h-[92px] items-start gap-3 rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF9F1C] ${selected ? 'border-[#FF9F1C] bg-[#FFF9F0] shadow-md shadow-[#FF9F1C]/10' : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-[#FF9F1C]/40 hover:bg-slate-50 hover:shadow-sm'}`}
              data-testid={`button-option-${option.value}`}
            >
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-colors ${selected ? 'bg-[#FF9F1C] text-slate-900' : 'bg-slate-100 text-slate-500 group-hover:bg-[#FFF9F0] group-hover:text-[#E07A00]'}`}>
                <Icon className="h-[18px] w-[18px]" strokeWidth={2.5} />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-bold text-slate-900">{option.label}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-500 font-medium">{option.description}</span>
              </span>
              <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-all ${selected ? 'border-[#FF9F1C] bg-[#FF9F1C] text-slate-900' : 'border-slate-300 text-transparent group-hover:border-[#FF9F1C]/40'}`}>
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
            </button>
          );
        })}
      </div>
      {values.length > 0 && <p className="mt-4 text-xs font-semibold text-[#1F67D4]" data-testid="status-selection-count">{values.length} selected</p>}
    </div>
  );
}

function CompanionStep({ value, onSelect }: { value: string; onSelect: (value: string) => void }) {
  return (
    <div>
      <StepHeading eyebrow="YOUR TRAVEL CREW" title="Who are you travelling with?" subtitle="Choose the group that best matches this trip." />
      <div className="mt-8 grid max-w-[670px] grid-cols-1 gap-3 sm:grid-cols-2">
        {companionOptions.map((option) => {
          const selected = value === option.value;
          const Icon = option.icon;
          return (
            <button
              type="button"
              key={option.value}
              onClick={() => onSelect(option.value)}
              aria-pressed={selected}
              className={`group relative flex min-h-[92px] items-start gap-3 rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF9F1C] ${selected ? 'border-[#FF9F1C] bg-[#FFF9F0] shadow-md shadow-[#FF9F1C]/10' : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-[#FF9F1C]/40 hover:bg-slate-50 hover:shadow-sm'}`}
              data-testid={`button-companion-${option.value}`}
            >
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-colors ${selected ? 'bg-[#FF9F1C] text-slate-900' : 'bg-slate-100 text-slate-500 group-hover:bg-[#FFF9F0] group-hover:text-[#E07A00]'}`}>
                <Icon className="h-[18px] w-[18px]" strokeWidth={2.5} />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-bold text-slate-900">{option.label}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-500 font-medium">{option.description}</span>
              </span>
              <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-all ${selected ? 'border-[#FF9F1C] bg-[#FF9F1C] text-slate-900' : 'border-slate-300 text-transparent group-hover:border-[#FF9F1C]/40'}`}>
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function InterestsStep({ values, onToggle }: { values: string[]; onToggle: (value: string) => void }) {
  return (
    <div>
      <StepHeading eyebrow="THE GOOD STUFF" title="What makes a trip feel like a trip?" subtitle="Choose up to five sparks. There’s no wrong answer, and you can always change your mind." />
      <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-slate-500" data-testid="status-interest-count">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-slate-700">{values.length}</span>
        of 5 selected
        {values.length === 5 && <span className="ml-1 text-[#1F67D4]">That’s a lovely mix.</span>}
      </div>
      <div className="mt-5 grid max-w-[720px] grid-cols-2 gap-2.5 sm:grid-cols-4">
        {interestOptions.map((option) => {
          const selected = values.includes(option.value);
          const disabled = !selected && values.length >= 5;
          const Icon = option.icon;
          return (
            <button
              type="button"
              key={option.value}
              disabled={disabled}
              onClick={() => onToggle(option.value)}
              aria-pressed={selected}
              className={`group flex min-h-[112px] flex-col justify-between rounded-2xl border p-3.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF9F1C] ${selected ? 'border-[#FF9F1C] bg-[#FFF9F0] shadow-sm' : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-[#FF9F1C]/40 hover:bg-slate-50 hover:shadow-sm'} ${disabled ? 'cursor-not-allowed opacity-40 hover:translate-y-0 hover:shadow-none' : ''}`}
              data-testid={`button-interest-${option.value}`}
            >
              <span className={`grid h-8 w-8 place-items-center rounded-lg ${selected ? 'bg-[#FF9F1C] text-slate-900' : 'bg-slate-100 text-slate-500 group-hover:bg-[#FFF9F0] group-hover:text-[#E07A00]'}`}><Icon className="h-4 w-4" strokeWidth={2.5} /></span>
              <span>
                <span className="block text-xs font-bold text-slate-900">{option.label}</span>
                <span className="mt-1 hidden text-[10px] leading-4 text-slate-500 font-medium sm:block">{option.description}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BudgetStep({ value, onSelect }: { value: string; onSelect: (value: string) => void }) {
  return (
    <div>
      <StepHeading eyebrow="FOR THIS ADVENTURE" title="What’s your budget for this trip?" subtitle="A loose guide is perfect. Think of your total trip budget, excluding flights." />
      <div className="mt-8 max-w-[650px] space-y-3">
        {budgetOptions.map((option) => {
          const selected = option.value === value;
          return (
            <button
              type="button"
              key={option.value}
              onClick={() => onSelect(option.value)}
              aria-pressed={selected}
              className={`group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF9F1C] ${selected ? 'border-[#FF9F1C] bg-[#FFF9F0] shadow-md shadow-[#FF9F1C]/10' : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-[#FF9F1C]/40 hover:bg-slate-50 hover:shadow-sm'}`}
              data-testid={`button-budget-${option.value}`}
            >
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${selected ? 'bg-[#FF9F1C] text-slate-900' : 'bg-slate-100 text-slate-500 group-hover:bg-[#FFF9F0] group-hover:text-[#E07A00]'}`}><IndianRupee className="h-[18px] w-[18px]" strokeWidth={2.5} /></span>
              <span className="flex-1">
                <span className="block text-sm font-bold text-slate-900">{option.label}</span>
                <span className="mt-1 block text-xs text-slate-500 font-medium">{option.detail}</span>
              </span>
              <span className={`grid h-5 w-5 place-items-center rounded-full border ${selected ? 'border-[#FF9F1C] bg-[#FF9F1C] text-slate-900' : 'border-slate-300 text-transparent group-hover:border-[#FF9F1C]/40'}`}><Check className="h-3 w-3" strokeWidth={3} /></span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CompletionState({
  draft,
  onEdit,
  syncState,
}: {
  draft: Draft;
  onEdit: () => void;
  syncState: 'local' | 'saving' | 'synced' | 'error';
}) {
  const [, setLocation] = useLocation();
  const [started, setStarted] = useState(false);
  const vibesLabel = draft.vibes.length ? draft.vibes.map((value) => displayValue(value, vibeOptions)).join(', ') : 'Open to any vibe';
  const companionsLabel = draft.companions ? displayValue(draft.companions, companionOptions) : 'Still deciding';
  const interestsLabel = draft.interests.length ? draft.interests.map((value) => displayValue(value, interestOptions)).join(', ') : 'A blank canvas';
  const budgetLabel = draft.budget ? displayValue(draft.budget, budgetOptions) : 'We’ll keep it flexible';
  const dietLabel = draft.diet.length ? draft.diet.map((value) => displayValue(value, dietOptions)).join(', ') : 'No notes yet';

  return (
    <div className="onboarding-enter mx-auto flex w-full max-w-[760px] flex-1 flex-col justify-center py-8 lg:py-12">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#2EC4B6] text-slate-900 shadow-lg shadow-[#2EC4B6]/20">
        <Check className="h-7 w-7" strokeWidth={3} />
      </div>
      <p className="mt-8 text-[11px] font-bold uppercase tracking-[.18em] text-[#1F67D4]">A promising beginning</p>
      <h2 className="mt-3 max-w-[560px] font-serif text-[2.3rem] font-extrabold leading-[1.06] tracking-[-.05em] text-slate-900 sm:text-[3.2rem]">Your starting point is ready.</h2>
      <p className="mt-4 max-w-[560px] text-sm leading-6 text-slate-600 sm:text-base font-medium">We’ll use these signals to make the next suggestions feel less like a list and more like a nudge in the right direction.</p>

      <div className="mt-8 grid max-w-[700px] gap-2.5 sm:grid-cols-2" data-testid="summary-onboarding">
        <SummaryLine icon={Sparkles} label="Trip vibes" value={vibesLabel} />
        <SummaryLine icon={UsersRound} label="Travelling with" value={companionsLabel} />
        <SummaryLine icon={Compass} label="Drawn to" value={interestsLabel} />
        <SummaryLine icon={IndianRupee} label="Budget for this trip" value={budgetLabel} />
        <SummaryLine icon={Utensils} label="Food notes" value={dietLabel} />
      </div>

      <div className="mt-9 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => {
            setStarted(true);
            setTimeout(() => setLocation('/discover'), 600);
          }}
          className="group inline-flex items-center gap-3 rounded-full bg-[#FF9F1C] px-6 py-3.5 text-sm font-bold text-slate-900 shadow-lg shadow-[#FF9F1C]/25 transition-all hover:-translate-y-0.5 hover:bg-[#F39200] hover:shadow-xl hover:shadow-[#FF9F1C]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF9F1C] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          data-testid="button-start-discovering"
        >
          Start discovering <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
        <button type="button" onClick={onEdit} className="rounded-full px-4 py-3.5 text-sm font-bold text-slate-500 transition-colors hover:text-slate-900 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF9F1C]" data-testid="button-edit-answers">
          Change answers
        </button>
      </div>
      {started && (
        <p className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-[#2EC4B6]/10 px-4 py-2.5 text-xs font-bold text-[#1F67D4]" role="status" data-testid="status-discovery-ready">
          <Check className="h-4 w-4 text-[#2EC4B6]" strokeWidth={3} /> Your discovery space is ready for the next step.
        </p>
      )}
      <p className="mt-6 text-xs text-slate-400 font-medium" data-testid="status-complete">
        {syncState === 'synced' && 'Saved to your account and this device.'}
        {syncState === 'saving' && 'Saving to your account…'}
        {syncState === 'error' && 'Saved on this device. Account sync will retry when you return.'}
        {syncState === 'local' && 'Saved on this device. Sign in from Discover to keep it across devices.'}
      </p>
    </div>
  );
}

function SummaryLine({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500"><Icon className="h-4 w-4" strokeWidth={2.5} /></span>
      <span className="min-w-0">
        <span className="block text-[10px] font-bold uppercase tracking-[.12em] text-[#1F67D4]">{label}</span>
        <span className="mt-1 block truncate text-xs font-bold text-slate-900">{value}</span>
      </span>
    </div>
  );
}

export default Onboarding;