import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AuthUI } from '@/components/ui/auth-fuse';

const ROLES = [
  { value: 'client', label: 'Client – I want to find and book engineers' },
  { value: 'engineer', label: 'Engineer – I offer consultation services' },
];

export default function Signup() {
  const { signUp } = useAuth();
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
        mode="sign-up"
        roles={ROLES}
        onSignUp={async ({ name, email, password, role }) => {
          await signUp(email, password, { name, role });
          navigate('/', { replace: true });
        }}
        signUpContent={{
          quote: {
            text: "Create your account book engineers in minutes.",
            author: "Buildwise",
          },
        }}
      />


    </div>
  );
}
