import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AuthUI } from '@/components/ui/auth-fuse';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="relative">
      <div className="absolute left-4 top-4 z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background/80 px-3 py-2 text-sm text-foreground backdrop-blur hover:bg-accent"
        >
          ← Back to home
        </Link>
      </div>

      <AuthUI
        mode="sign-in"
        onSignIn={async ({ email, password }) => {
          await signIn(email, password);
          navigate('/', { replace: true });
        }}
        signInContent={{
          quote: {
            text: "Welcome back your next build starts here.",
            author: "Buildwise",
          },
        }}
      />

      
    </div>
  );
}
