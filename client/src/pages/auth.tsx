import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { BookOpen, Sparkles, GraduationCap, Star } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { LanguageToggle } from "@/components/language-toggle";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, isRTL } = useLanguage();

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});

  const [registerData, setRegisterData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({});

  const handleLoginChange = (field: string, value: string) => {
    setLoginData(prev => ({ ...prev, [field]: value }));
    if (loginErrors[field]) {
      setLoginErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleRegisterChange = (field: string, value: string) => {
    setRegisterData(prev => ({ ...prev, [field]: value }));
    if (registerErrors[field]) {
      setRegisterErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return res.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("userId", data.user.id);
      localStorage.setItem("userName", data.user.fullName);
      toast({ title: t.auth.loginSuccess, description: t.auth.loginSuccessDesc });
      setLocation("/");
    },
    onError: () => {
      toast({ title: t.auth.loginError, description: t.auth.loginErrorDesc, variant: "destructive" });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; fullName: string }) => {
      const res = await apiRequest("POST", "/api/auth/register", data);
      return res.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("userId", data.user.id);
      localStorage.setItem("userName", data.user.fullName);
      toast({ title: t.auth.registerSuccess, description: t.auth.registerSuccessDesc });
      setLocation("/");
    },
    onError: () => {
      toast({ title: t.auth.registerError, description: t.auth.registerErrorDesc, variant: "destructive" });
    },
  });

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginData.email)) {
      errors.email = t.auth.invalidEmail;
    }
    if (loginData.password.length < 6) {
      errors.password = t.auth.passwordMin;
    }
    
    if (Object.keys(errors).length > 0) {
      setLoginErrors(errors);
      return;
    }
    
    loginMutation.mutate(loginData);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors: Record<string, string> = {};
    if (registerData.fullName.trim().length < 2) {
      errors.fullName = t.auth.nameMin;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerData.email)) {
      errors.email = t.auth.invalidEmail;
    }
    if (registerData.password.length < 6) {
      errors.password = t.auth.passwordMin;
    }
    if (registerData.password !== registerData.confirmPassword) {
      errors.confirmPassword = t.auth.passwordMismatch;
    }
    
    if (Object.keys(errors).length > 0) {
      setRegisterErrors(errors);
      return;
    }
    
    registerMutation.mutate({
      email: registerData.email,
      password: registerData.password,
      fullName: registerData.fullName
    });
  };

  const resetForms = () => {
    setLoginData({ email: '', password: '' });
    setLoginErrors({});
    setRegisterData({ fullName: '', email: '', password: '', confirmPassword: '' });
    setRegisterErrors({});
  };

  const features = [
    { icon: BookOpen, text: t.auth.feature1 },
    { icon: Sparkles, text: t.auth.feature4 },
    { icon: GraduationCap, text: t.auth.feature2 },
    { icon: Star, text: t.auth.feature3 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex" dir={isRTL ? "rtl" : "ltr"}>
      <div className="absolute top-4 right-4 z-10">
        <LanguageToggle />
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              {isLogin ? t.auth.login : t.auth.createAccount}
            </CardTitle>
            <CardDescription>
              {isLogin ? t.auth.loginDesc : t.auth.registerDesc}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLogin ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">{t.auth.email}</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="example@email.com"
                    value={loginData.email}
                    onChange={(e) => handleLoginChange('email', e.target.value)}
                    data-testid="input-email"
                    className="text-left"
                    dir="ltr"
                  />
                  {loginErrors.email && (
                    <p className="text-sm text-destructive">{loginErrors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">{t.auth.password}</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) => handleLoginChange('password', e.target.value)}
                    data-testid="input-password"
                  />
                  {loginErrors.password && (
                    <p className="text-sm text-destructive">{loginErrors.password}</p>
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? t.common.loading : t.auth.login}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-fullname">{t.auth.fullName}</Label>
                  <Input
                    id="register-fullname"
                    type="text"
                    placeholder={t.dashboard.sampleNamePlaceholder}
                    value={registerData.fullName}
                    onChange={(e) => handleRegisterChange('fullName', e.target.value)}
                    data-testid="input-fullname"
                  />
                  {registerErrors.fullName && (
                    <p className="text-sm text-destructive">{registerErrors.fullName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">{t.auth.email}</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="example@email.com"
                    value={registerData.email}
                    onChange={(e) => handleRegisterChange('email', e.target.value)}
                    data-testid="input-email-register"
                    className="text-left"
                    dir="ltr"
                  />
                  {registerErrors.email && (
                    <p className="text-sm text-destructive">{registerErrors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">{t.auth.password}</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="••••••••"
                    value={registerData.password}
                    onChange={(e) => handleRegisterChange('password', e.target.value)}
                    data-testid="input-password-register"
                  />
                  {registerErrors.password && (
                    <p className="text-sm text-destructive">{registerErrors.password}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-confirm">{t.auth.confirmPassword}</Label>
                  <Input
                    id="register-confirm"
                    type="password"
                    placeholder="••••••••"
                    value={registerData.confirmPassword}
                    onChange={(e) => handleRegisterChange('confirmPassword', e.target.value)}
                    data-testid="input-confirm-password"
                  />
                  {registerErrors.confirmPassword && (
                    <p className="text-sm text-destructive">{registerErrors.confirmPassword}</p>
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={registerMutation.isPending}
                  data-testid="button-register"
                >
                  {registerMutation.isPending ? t.common.loading : t.auth.register}
                </Button>
              </form>
            )}
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  resetForms();
                }}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
                data-testid="button-toggle-auth"
              >
                {isLogin ? t.auth.noAccount : t.auth.hasAccount}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 to-emerald-600 items-center justify-center p-12">
        <div className="text-white max-w-lg">
          <h1 className="text-4xl font-bold mb-6">
            {t.auth.appName}
          </h1>
          <p className="text-xl opacity-90 mb-8 leading-relaxed">
            {t.auth.heroTagline}
          </p>
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-4 bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <feature.icon className="w-5 h-5" />
                </div>
                <span className="text-lg">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
