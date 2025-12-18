import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { BookOpen, Sparkles, GraduationCap, Star } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { LanguageToggle } from "@/components/language-toggle";

type LoginForm = {
  email: string;
  password: string;
};

type RegisterForm = LoginForm & {
  fullName: string;
  confirmPassword: string;
};

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, isRTL } = useLanguage();

  const loginSchema = useMemo(() => z.object({
    email: z.string().email(t.auth.invalidEmail),
    password: z.string().min(6, t.auth.passwordMin),
  }), [t]);

  const registerSchema = useMemo(() => z.object({
    email: z.string().email(t.auth.invalidEmail),
    password: z.string().min(6, t.auth.passwordMin),
    fullName: z.string().min(2, t.auth.nameMin),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t.auth.passwordMismatch,
    path: ["confirmPassword"],
  }), [t]);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", fullName: "", confirmPassword: "" },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
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
    mutationFn: async (data: RegisterForm) => {
      const res = await apiRequest("POST", "/api/auth/register", {
        email: data.email,
        password: data.password,
        fullName: data.fullName,
      });
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
            {/* DEBUG: Plain HTML input test */}
            <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#ffffcc', borderRadius: '8px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                TEST INPUT (Plain HTML):
              </label>
              <input 
                type="text"
                placeholder="Can you type here?"
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '2px solid #333',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
                onChange={(e) => console.log('Plain input value:', e.target.value)}
              />
            </div>
            
            {isLogin ? (
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit((data) => loginMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.auth.email}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="example@email.com" 
                            type="email" 
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                            data-testid="input-email"
                            className="text-left"
                            dir="ltr"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.auth.password}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="••••••••" 
                            type="password" 
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                            data-testid="input-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loginMutation.isPending}
                    data-testid="button-login"
                  >
                    {loginMutation.isPending ? t.common.loading : t.auth.login}
                  </Button>
                </form>
              </Form>
            ) : (
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit((data) => registerMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.auth.fullName}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t.dashboard.sampleNamePlaceholder} 
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                            data-testid="input-fullname"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.auth.email}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="example@email.com" 
                            type="email" 
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                            data-testid="input-email-register"
                            className="text-left"
                            dir="ltr"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.auth.password}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="••••••••" 
                            type="password" 
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                            data-testid="input-password-register"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.auth.confirmPassword}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="••••••••" 
                            type="password" 
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                            data-testid="input-confirm-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={registerMutation.isPending}
                    data-testid="button-register"
                  >
                    {registerMutation.isPending ? t.common.loading : t.auth.register}
                  </Button>
                </form>
              </Form>
            )}
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  loginForm.reset();
                  registerForm.reset();
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
