import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Leaf, LockKeyhole, Mail, Sparkles, UserRound } from "lucide-react";
import api, { getErrorMessage } from "./api.js";

export default function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const isSignup = mode === "signup";

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (isSignup && password !== confirmPassword) {
      setError("Your passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post(isSignup ? "/auth/register" : "/auth/login", {
        ...(isSignup ? { name: name.trim() } : {}),
        email: email.trim().toLowerCase(),
        password
      });
      onAuthenticated(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-story">
        <div className="auth-brand"><span className="auth-brand-mark"><Leaf size={22} /></span><span>moodly<span className="brand-dot">.</span></span></div>
        <div className="auth-story-content">
          <span className="auth-eyebrow"><Sparkles size={14} /> A LITTLE SPACE, JUST FOR YOU</span>
          <h1>Your feelings deserve<br /><em>a place to land.</em></h1>
          <p>A gentle space to check in with yourself, notice your patterns, and celebrate the small things that make you feel like you.</p>
          <div className="auth-quote">
            <div className="auth-quote-emoji">🌱</div>
            <div><p>“You don't have to have it all figured out to begin taking care of yourself.”</p><span>A reminder for today</span></div>
          </div>
        </div>
        <div className="auth-story-footer"><span>YOUR WELLNESS SPACE</span><span>Made for the ups, downs & in-betweens.</span></div>
        <div className="auth-orb auth-orb-one" /><div className="auth-orb auth-orb-two" />
      </section>

      <section className="auth-form-side">
        <div className="auth-mobile-brand"><span className="auth-brand-mark"><Leaf size={20} /></span><span>moodly<span className="brand-dot">.</span></span></div>
        <div className="auth-form-wrap">
          <div className="auth-heading">
            <span className="auth-small-label">{isSignup ? "A FRESH START" : "WELCOME BACK"}</span>
            <h2>{isSignup ? "Create your space" : "Good to see you."}</h2>
            <p>{isSignup ? "Start getting to know your moods, one day at a time." : "Sign in to pick up where you left off."}</p>
          </div>
          <div className="auth-tabs" role="tablist" aria-label="Account options">
            <button type="button" role="tab" aria-selected={!isSignup} className={!isSignup ? "selected" : ""} onClick={() => { setMode("login"); setError(""); }}>Sign in</button>
            <button type="button" role="tab" aria-selected={isSignup} className={isSignup ? "selected" : ""} onClick={() => { setMode("signup"); setError(""); }}>Sign up</button>
          </div>
          <form className="auth-form" onSubmit={submit}>
            {isSignup && <label className="auth-field"><span>Full name</span><div className="auth-input-wrap"><UserRound size={17} /><input autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="What should we call you?" minLength={2} maxLength={60} required /></div></label>}
            <label className="auth-field"><span>Email address</span><div className="auth-input-wrap"><Mail size={17} /><input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required maxLength={254} /></div></label>
            <label className="auth-field"><span>Password</span><div className="auth-input-wrap"><LockKeyhole size={17} /><input type={showPassword ? "text" : "password"} autoComplete={isSignup ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={isSignup ? "At least 8 characters" : "Enter your password"} minLength={isSignup ? 8 : undefined} maxLength={128} required /><button className="password-toggle" type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
            {isSignup && <label className="auth-field"><span>Confirm password</span><div className="auth-input-wrap"><LockKeyhole size={17} /><input type={showPassword ? "text" : "password"} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Enter your password again" minLength={8} maxLength={128} required /></div></label>}
            {error && <div className="auth-error" role="alert">{error}</div>}
            <button className="auth-submit" type="submit" disabled={busy}>{busy ? "Please wait…" : isSignup ? "Create my account" : "Sign in to your space"} <ArrowRight size={17} /></button>
          </form>
          <p className="auth-terms"><LockKeyhole size={13} /> Your account and mood entries are private to your login.</p>
          <p className="auth-switch">{isSignup ? "Already have an account?" : "New to moodly?"} <button type="button" onClick={() => { setMode(isSignup ? "login" : "signup"); setError(""); }}>{isSignup ? "Sign in" : "Create an account"}</button></p>
        </div>
        <span className="auth-copyright">TAKE IT ONE DAY AT A TIME · © MOODLY</span>
      </section>
    </main>
  );
}
