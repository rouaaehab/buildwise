import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Hero from '../components/Hero';
import HowItWorks from '../components/HowItWorks';
import AboutSection from '../components/AboutSection';
import { PremiumContact } from '../components/ui/premium-contact';
import RoadmapSection from '../components/RoadmapSection';
import Footer from '../components/Footer';

export default function Home() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Hero />
      <HowItWorks />
      <AboutSection />
      <PremiumContact />
      <RoadmapSection />
      {/* <Footer /> */}
      {user && (
        <div className="fixed bottom-4 left-4 right-4 z-20 mx-auto max-w-md rounded-lg bg-black/60 backdrop-blur-sm px-4 py-2 text-center text-sm text-white/90">
          Logged in as <strong>{profile?.role}</strong>.
          {profile?.role === 'engineer' && (
            <> <Link to="/dashboard/engineer" className="text-primary font-medium underline">Go to dashboard</Link></>
          )}
        </div>
      )}
    </div>
  );
}
