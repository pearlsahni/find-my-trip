import { type ReactNode, useEffect, useRef } from 'react';
import { ClerkProvider, Show, SignIn, SignUp, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import Onboarding from '@/pages/onboarding';
import CountryRoute from '@/pages/country-page';
import CityRoute from '@/pages/city-page';
import Discover from '@/pages/discover';
import { Redirect, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
}

if (!clerkPubKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    socialButtonsPlacement: 'top' as const,
    socialButtonsVariant: 'blockButton' as const,
  },
  variables: {
    colorPrimary: '#E56A48', colorForeground: '#283341', colorMutedForeground: '#68717C',
    colorDanger: '#B83A2C', colorBackground: '#FFFFFF', colorInput: '#FFFDF8',
    colorInputForeground: '#283341', colorNeutral: '#D8D1C6',
    fontFamily: 'Outfit, sans-serif', borderRadius: '1rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center', cardBox: 'bg-white rounded-3xl w-[440px] max-w-full overflow-hidden shadow-xl',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none', footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#283341] font-serif', headerSubtitle: 'text-[#68717c]',
    socialButtonsBlockButtonText: 'text-[#283341] font-semibold', formFieldLabel: 'text-[#46515e]',
    footerActionLink: 'text-[#b76400] font-bold', footerActionText: 'text-[#68717c]', dividerText: 'text-[#838982]',
    identityPreviewEditButton: 'text-[#b76400]', formFieldSuccessText: 'text-[#357d69]', alertText: 'text-[#8f2f22]',
    logoBox: 'h-14', logoImage: 'max-h-14 w-auto', socialButtonsBlockButton: 'border-[#d8d1c6] bg-[#fffdf8]',
    formButtonPrimary: 'bg-[#e56a48] hover:bg-[#d45636]', formFieldInput: 'border-[#d8d1c6] bg-[#fffdf8] text-[#283341]',
    form: 'hidden', dividerRow: 'hidden', footerAction: 'hidden', dividerLine: 'bg-[#e6dfd6]', alert: 'bg-[#fff0ec]', otpCodeFieldInput: 'border-[#d8d1c6]',
    formFieldRow: 'text-[#283341]', main: 'gap-5',
  },
};

function AuthPage({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#f8f6f1] px-5 py-10">
      {mode === 'sign-in'
        ? <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} fallbackRedirectUrl={`${basePath}/discover`} />
        : <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} fallbackRedirectUrl={`${basePath}/discover`} />}
    </main>
  );
}

function Home() {
  return <><Show when="signed-in"><Redirect to="/discover" /></Show><Show when="signed-out"><Onboarding /></Show></>;
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/sign-in/*?">{() => <AuthPage mode="sign-in" />}</Route>
        <Route path="/sign-up/*?">{() => <AuthPage mode="sign-up" />}</Route>
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/discover" component={Discover} />
        <Route path="/c/:countrySlug/:citySlug" component={CityRoute} />
        <Route path="/c/:countrySlug" component={CountryRoute} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const client = useQueryClient();
  const previous = useRef<string | null | undefined>(undefined);
  useEffect(() => addListener(({ user }) => {
    const next = user?.id ?? null;
    if (previous.current !== undefined && previous.current !== next) client.clear();
    previous.current = next;
  }), [addListener, client]);
  return null;
}

function ClerkRoutes() {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`}
      localization={{ signIn: { start: { title: 'Welcome back', subtitle: 'Sign in with Google to sync your travel taste' } }, signUp: { start: { title: 'Keep your travel taste', subtitle: 'Continue with Google to save it across devices' } } }}
      routerPush={(to) => setLocation(stripBase(to))} routerReplace={(to) => setLocation(stripBase(to), { replace: true })}>
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider><Router /><Toaster /></TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default function App() {
  return <WouterRouter base={basePath}><ClerkRoutes /></WouterRouter>;
}