import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../config/env";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { Label } from "../../../components/ui/label";
import { toast, Toaster } from "react-hot-toast";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(false);
  const [resetting, setResetting] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setProgress(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setProgress(false);
    } else {
      setTimeout(() => {
        setProgress(false);
        navigate("/");
      }, 800);
    }
  };

  const handleReset = async () => {
    if (!email) {
      setError("Enter your email to reset your password.");
      return;
    }
    setResetting(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setResetting(false);
    if (error) {
      setError(error.message);
      return;
    }
    toast.success("Password reset link sent to your email.");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              MEducation
            </p>
            <CardTitle className="text-2xl">Sign in</CardTitle>
            <p className="text-sm text-muted-foreground">
              Access your student portal securely.
            </p>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleLogin}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex justify-between text-sm">
                <Button
                  type="button"
                  variant="link"
                  className="px-0 font-medium"
                  onClick={handleReset}
                  disabled={resetting}
                >
                  {resetting ? "Sending reset link..." : "Forgot password?"}
                </Button>
              </div>
              <Button type="submit" className="w-full" disabled={progress}>
                {progress ? "Signing in..." : "Login"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <Toaster position="top-right" />
    </div>
  );
};
