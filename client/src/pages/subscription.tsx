import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Crown, Sparkles, Users, ArrowRight, BookOpen } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Price {
  id: string;
  unit_amount: number;
  currency: string;
  recurring: { interval: string } | null;
  active: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string;
  active: boolean;
  metadata: {
    tier: string;
    monthlyChapters: string;
    maxChildren: string;
  };
  prices: Price[];
}

const tierIcons: Record<string, typeof Crown> = {
  basic: BookOpen,
  pro: Sparkles,
  family: Users,
};

const tierColors: Record<string, string> = {
  basic: "from-blue-500 to-blue-600",
  pro: "from-purple-500 to-purple-600",
  family: "from-amber-500 to-amber-600",
};

export default function SubscriptionPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const userId = localStorage.getItem("userId");
  const userName = localStorage.getItem("userName");

  const { data: productsData, isLoading } = useQuery<{ data: Product[] }>({
    queryKey: ["/api/stripe/products"],
    enabled: !!userId,
  });

  const checkoutMutation = useMutation({
    mutationFn: async (priceId: string) => {
      const res = await apiRequest("POST", "/api/stripe/checkout", {
        userId,
        priceId,
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل فتح صفحة الدفع",
        variant: "destructive",
      });
    },
  });

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("ar-SA", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  if (!userId) {
    setLocation("/auth");
    return null;
  }

  const products = productsData?.data || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" dir="rtl">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <Crown className="w-3 h-3 ml-1" />
            خطط الاشتراك
          </Badge>
          <h1 className="text-4xl font-bold mb-4 font-cairo">اختر الخطة المناسبة لعائلتك</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            استثمر في مستقبل أطفالك مع LearnSnap - تعلم تفاعلي مدعوم بالذكاء الاصطناعي
          </p>
        </div>

        <div className="mb-8 text-center">
          <Card className="inline-block">
            <CardContent className="py-4 px-6 flex items-center gap-4">
              <div className="flex items-center gap-2 text-green-600">
                <Check className="w-5 h-5" />
                <span>ضمان استرداد لمدة 7 أيام</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2 text-green-600">
                <Check className="w-5 h-5" />
                <span>إلغاء في أي وقت</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2 text-green-600">
                <Check className="w-5 h-5" />
                <span>دعم فني على مدار الساعة</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="relative">
                <CardHeader>
                  <Skeleton className="h-8 w-24 mb-2" />
                  <Skeleton className="h-12 w-32" />
                  <Skeleton className="h-4 w-full mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <Card className="max-w-md mx-auto">
              <CardContent className="py-12">
                <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">الخطط قادمة قريباً</h3>
                <p className="text-muted-foreground mb-6">
                  نعمل على إعداد خطط اشتراك مميزة لك
                </p>
                <Button onClick={() => setLocation("/dashboard")} data-testid="button-back-dashboard">
                  العودة للوحة التحكم
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {products.map((product, index) => {
              const tier = product.metadata?.tier || "basic";
              const Icon = tierIcons[tier] || BookOpen;
              const color = tierColors[tier] || "from-blue-500 to-blue-600";
              const price = product.prices[0];
              const isPopular = tier === "pro";

              return (
                <Card 
                  key={product.id} 
                  className={`relative transition-all duration-300 ${isPopular ? "ring-2 ring-purple-500 scale-105" : ""}`}
                  data-testid={`card-subscription-${tier}`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className={`bg-gradient-to-r ${color} text-white`}>
                        الأكثر شعبية
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pt-8">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${color} flex items-center justify-center`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl">{product.name}</CardTitle>
                    {price && (
                      <div className="mt-4">
                        <span className="text-4xl font-bold">
                          {formatPrice(price.unit_amount, price.currency)}
                        </span>
                        <span className="text-muted-foreground">/شهرياً</span>
                      </div>
                    )}
                    <CardDescription className="mt-2">
                      {product.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pb-4">
                    <ul className="space-y-3">
                      <li className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${color} flex items-center justify-center`}>
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span>
                          {product.metadata?.monthlyChapters === "unlimited" 
                            ? "فصول غير محدودة" 
                            : `${product.metadata?.monthlyChapters || "5"} فصول شهرياً`}
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${color} flex items-center justify-center`}>
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span>
                          {product.metadata?.maxChildren === "1" 
                            ? "طفل واحد" 
                            : `حتى ${product.metadata?.maxChildren || "1"} أطفال`}
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${color} flex items-center justify-center`}>
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span>تقارير مفصلة للأداء</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${color} flex items-center justify-center`}>
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span>دعم فني</span>
                      </li>
                    </ul>
                  </CardContent>
                  
                  <CardFooter>
                    <Button
                      className={`w-full ${isPopular ? `bg-gradient-to-r ${color} hover:opacity-90` : ""}`}
                      variant={isPopular ? "default" : "outline"}
                      size="lg"
                      onClick={() => price && checkoutMutation.mutate(price.id)}
                      disabled={!price || checkoutMutation.isPending}
                      data-testid={`button-subscribe-${tier}`}
                    >
                      {checkoutMutation.isPending ? "جاري التحميل..." : "اشترك الآن"}
                      <ArrowRight className="w-4 h-4 mr-2" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        <div className="text-center mt-12">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/dashboard")}
            data-testid="button-back"
          >
            العودة للوحة التحكم
          </Button>
        </div>
      </div>
    </div>
  );
}
