"use client";

import * as React from "react";
import { useEffect, useId, useMemo, useState } from "react";
import { Slot } from "@radix-ui/react-slot";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva } from "class-variance-authority";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function Typewriter({
  text,
  speed = 100,
  cursor = "|",
  loop = false,
  deleteSpeed = 50,
  delay = 1500,
  className,
}) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [textArrayIndex, setTextArrayIndex] = useState(0);

  const textArray = Array.isArray(text) ? text : [text];
  const currentText = textArray[textArrayIndex] || "";

  useEffect(() => {
    if (!currentText) return;

    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          if (currentIndex < currentText.length) {
            setDisplayText((prev) => prev + currentText[currentIndex]);
            setCurrentIndex((prev) => prev + 1);
          } else if (loop) {
            setTimeout(() => setIsDeleting(true), delay);
          }
        } else {
          if (displayText.length > 0) {
            setDisplayText((prev) => prev.slice(0, -1));
          } else {
            setIsDeleting(false);
            setCurrentIndex(0);
            setTextArrayIndex((prev) => (prev + 1) % textArray.length);
          }
        }
      },
      isDeleting ? deleteSpeed : speed
    );

    return () => clearTimeout(timeout);
  }, [
    currentIndex,
    isDeleting,
    currentText,
    loop,
    speed,
    deleteSpeed,
    delay,
    displayText,
    textArray.length,
  ]);

  return (
    <span className={className}>
      {displayText}
      <span className="animate-pulse">{cursor}</span>
    </span>
  );
}

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

const Label = React.forwardRef(function Label({ className, ...props }, ref) {
  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(labelVariants(), className)}
      {...props}
    />
  );
});

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input dark:border-input/50 bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary-foreground/60 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-md px-6",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(function Button(
  { className, variant, size, asChild = false, ...props },
  ref
) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});

const Input = React.forwardRef(function Input(
  { className, type, ...props },
  ref
) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-lg border border-input dark:border-input/50 bg-white px-3 py-3 text-sm text-foreground shadow-sm shadow-black/5 transition-shadow placeholder:text-muted-foreground/70 focus-visible:bg-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

const PasswordInput = React.forwardRef(function PasswordInput(
  { className, label, ...props },
  ref
) {
  const id = useId();
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="grid w-full items-center gap-2">
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          className={cn("pe-10", className)}
          ref={ref}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute inset-y-0 end-0 flex h-full w-10 items-center justify-center text-muted-foreground/80 transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
});

function SignInForm({ onSubmit, loading, error }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.({ email, password });
      }}
      autoComplete="on"
      className="flex flex-col gap-8"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Sign in to your account</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Enter your email below to sign in
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-foreground">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="m@example.com"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <PasswordInput
          name="password"
          label="Password"
          required
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button type="submit" variant="outline" className="mt-2" disabled={loading}>
          {loading ? "Signing in…" : "Sign In"}
        </Button>
      </div>
    </form>
  );
}

function SignUpForm({ onSubmit, loading, error, roles }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(roles?.[0]?.value || "client");

  const showRoles = Array.isArray(roles) && roles.length > 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.({ name, email, password, role });
      }}
      autoComplete="on"
      className="flex flex-col gap-8"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Create an account</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Enter your details below to sign up
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-foreground">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4">
        <div className="grid gap-1">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="ROUAA EHAB"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="m@example.com"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <PasswordInput
          name="password"
          label="Password"
          required
          autoComplete="new-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {showRoles ? (
          <div className="grid gap-2">
            <Label>Account type</Label>
            <div className="grid gap-2">
              {roles.map((r) => (
                <label
                  key={r.value}
                  className="flex cursor-pointer items-start gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-card-foreground hover:bg-accent"
                >
                  <input
                    type="radio"
                    name="role"
                    value={r.value}
                    checked={role === r.value}
                    onChange={(e) => setRole(e.target.value)}
                    className="mt-1 accent-[color:var(--primary)]"
                  />
                  <span className="leading-snug">{r.label}</span>
                </label>
              ))}
            </div>
          </div>
        ) : null}

        <Button type="submit" variant="outline" className="mt-2" disabled={loading}>
          {loading ? "Creating account…" : "Sign Up"}
        </Button>
      </div>
    </form>
  );
}

const defaultSignInContent = {
  image: {
    src: "https://cdn.eduadvisor.my/article/2023/02/how-to-be-an-interior-designer-work-exp.webp",
    alt: "Team collaborating",
  },
  quote: {
    text: "Welcome back — let’s ship something great.",
    author: "Buildwise",
  },
};

const defaultSignUpContent = {
  image: {
    src: "https://cdn.eduadvisor.my/article/2023/02/how-to-be-an-interior-designer-reg-interior-designer.webp",
    alt: "Planning session",
  },
  quote: {
    text: "Create an account. A new project awaits.",
    author: "Buildwise",
  },
};

/**
 * AuthUI (auth-fuse)
 *
 * Props:
 * - mode: "sign-in" | "sign-up" (locks the UI to one mode)
 * - defaultMode: initial mode when mode is not provided
 * - onSignIn: ({ email, password }) => Promise<void>
 * - onSignUp: ({ name, email, password, role }) => Promise<void>
 * - roles: [{ value, label }] (optional, for sign-up)
 * - signInContent/signUpContent: { image, quote } overrides
 */
export function AuthUI({
  mode,
  defaultMode = "sign-in",
  onSignIn,
  onSignUp,
  roles,
  signInContent = {},
  signUpContent = {},
}) {
  const [internalMode, setInternalMode] = useState(defaultMode);
  const isLocked = Boolean(mode);
  const currentMode = mode || internalMode;
  const isSignIn = currentMode === "sign-in";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleForm = () => {
    if (isLocked) return;
    setError("");
    setInternalMode((prev) => (prev === "sign-in" ? "sign-up" : "sign-in"));
  };

  const finalSignInContent = useMemo(
    () => ({
      image: { ...defaultSignInContent.image, ...signInContent.image },
      quote: { ...defaultSignInContent.quote, ...signInContent.quote },
    }),
    [signInContent.image, signInContent.quote]
  );

  const finalSignUpContent = useMemo(
    () => ({
      image: { ...defaultSignUpContent.image, ...signUpContent.image },
      quote: { ...defaultSignUpContent.quote, ...signUpContent.quote },
    }),
    [signUpContent.image, signUpContent.quote]
  );

  const currentContent = isSignIn ? finalSignInContent : finalSignUpContent;

  const handleSignIn = async (payload) => {
    setError("");
    setLoading(true);
    try {
      await onSignIn?.(payload);
    } catch (e) {
      setError(e?.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (payload) => {
    setError("");
    setLoading(true);
    try {
      await onSignUp?.(payload);
    } catch (e) {
      setError(e?.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen md:grid md:grid-cols-2 bg-background text-foreground">
      <style>{`
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear {
          display: none;
        }
      `}</style>

      <div className="flex min-h-screen items-center justify-center p-6 md:min-h-0 md:p-0 md:py-12">
        <div className="mx-auto grid w-[350px] gap-2">
          {isSignIn ? (
            <SignInForm onSubmit={handleSignIn} loading={loading} error={error} />
          ) : (
            <SignUpForm
              onSubmit={handleSignUp}
              loading={loading}
              error={error}
              roles={roles}
            />
          )}

          <div className="text-center text-sm">
            {isSignIn ? "Don't have an account?" : "Already have an account?"}{" "}
            {isLocked ? (
              <a
                href={isSignIn ? "/signup" : "/login"}
                className="pl-1 font-medium text-foreground hover:underline"
              >
                {isSignIn ? "Sign up" : "Sign in"}
              </a>
            ) : (
              <Button
                type="button"
                variant="link"
                className="pl-1 text-foreground"
                onClick={toggleForm}
              >
                {isSignIn ? "Sign up" : "Sign in"}
              </Button>
            )}
          </div>

          <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
            <span className="relative z-10 bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>

          <Button
            variant="outline"
            type="button"
            onClick={() => console.log("UI: Google button clicked")}
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google icon"
              className="mr-2 h-4 w-4"
            />
            Continue with Google
          </Button>
        </div>
      </div>

      <div
        className="hidden md:block relative bg-cover bg-center transition-all duration-500 ease-in-out"
        style={{ backgroundImage: `url(${currentContent.image.src})` }}
        key={currentContent.image.src}
      >
        <div className="absolute inset-0 bg-black/25" />
        <div className="absolute inset-x-0 bottom-0 h-[120px] bg-gradient-to-t from-background to-transparent" />

        <div className="relative z-10 flex h-full flex-col items-center justify-end p-6 pb-10">
          <blockquote className="max-w-md space-y-2 text-center">
            <p className="text-3xl font-medium text-white">
              “
              <Typewriter
                key={currentContent.quote.text}
                text={currentContent.quote.text}
                speed={60}
              />
              ”
            </p>
            <cite className="block text-sm font-light text-white/70 not-italic">
              — {currentContent.quote.author}
            </cite>
          </blockquote>
        </div>
      </div>
    </div>
  );
}

