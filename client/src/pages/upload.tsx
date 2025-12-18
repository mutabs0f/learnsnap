import { useState, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Upload as UploadIcon, 
  X, 
  Image as ImageIcon, 
  ArrowRight,
  BookOpen,
  Camera,
  Lightbulb,
  CheckCircle,
  Loader2
} from "lucide-react";
import type { Child } from "@shared/schema";

const subjects = [
  { value: "math", label: "الرياضيات" },
  { value: "science", label: "العلوم" },
  { value: "arabic", label: "اللغة العربية" },
  { value: "english", label: "اللغة الإنجليزية" },
  { value: "islamic", label: "التربية الإسلامية" },
  { value: "social", label: "الدراسات الاجتماعية" },
];

const grades = [
  { value: "1", label: "الصف الأول" },
  { value: "2", label: "الصف الثاني" },
  { value: "3", label: "الصف الثالث" },
  { value: "4", label: "الصف الرابع" },
  { value: "5", label: "الصف الخامس" },
  { value: "6", label: "الصف السادس" },
];

const tips = [
  { icon: Lightbulb, text: "تأكد من إضاءة جيدة للصور" },
  { icon: Camera, text: "صوّر الصفحة بشكل مستقيم" },
  { icon: CheckCircle, text: "تأكد من وضوح النص" },
];

interface UploadedPhoto {
  id: string;
  file: File;
  preview: string;
  pageNumber: number;
}

export default function UploadPage() {
  const [, setLocation] = useLocation();
  const parentId = localStorage.getItem("userId");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedChild, setSelectedChild] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [grade, setGrade] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const { data: children, isLoading: loadingChildren } = useQuery<Child[]>({
    queryKey: ["/api/children", parentId],
    enabled: !!parentId,
  });

  const createChapterMutation = useMutation({
    mutationFn: async () => {
      setIsUploading(true);
      setUploadProgress(10);

      const photoDataPromises = photos.map(async (photo) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(photo.file);
        });
      });

      const photoDataArray = await Promise.all(photoDataPromises);
      setUploadProgress(30);

      const res = await apiRequest("POST", "/api/chapters", {
        childId: selectedChild,
        parentId,
        title,
        subject,
        grade: parseInt(grade),
        photos: photoDataArray.map((data, index) => ({
          photoData: data,
          pageNumber: index + 1,
        })),
      });

      setUploadProgress(50);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chapters"] });
      toast({ title: "تم الإرسال!", description: "جاري معالجة الفصل..." });
      setLocation(`/chapter/${data.chapter.id}/processing`);
    },
    onError: () => {
      setIsUploading(false);
      toast({ title: "خطأ", description: "حدث خطأ أثناء إرسال الفصل", variant: "destructive" });
    },
  });

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const validFiles = Array.from(files).filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      return validTypes.includes(file.type) && file.size <= maxSize;
    });

    if (validFiles.length === 0) {
      toast({ 
        title: "ملفات غير صالحة", 
        description: "الرجاء رفع صور بصيغة JPG أو PNG (حد أقصى 10MB)", 
        variant: "destructive" 
      });
      return;
    }

    const newPhotos: UploadedPhoto[] = validFiles.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      file,
      preview: URL.createObjectURL(file),
      pageNumber: photos.length + index + 1,
    }));

    setPhotos(prev => [...prev, ...newPhotos].slice(0, 20));
  }, [photos.length, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const removePhoto = (id: string) => {
    setPhotos(prev => {
      const updated = prev.filter(p => p.id !== id);
      return updated.map((p, i) => ({ ...p, pageNumber: i + 1 }));
    });
  };

  const canSubmit = selectedChild && subject && grade && title && photos.length >= 1;

  if (!parentId) {
    setLocation("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <UploadIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold font-arabic">إضافة فصل جديد</h1>
                <p className="text-xs text-muted-foreground font-arabic">صوّر صفحات الكتاب وأرسلها</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-arabic">معلومات الفصل</CardTitle>
                <CardDescription className="font-arabic">اختر الطفل والمادة والصف الدراسي</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-arabic">اختر الطفل</Label>
                  <Select value={selectedChild} onValueChange={setSelectedChild}>
                    <SelectTrigger data-testid="select-child">
                      <SelectValue placeholder="اختر الطفل" />
                    </SelectTrigger>
                    <SelectContent>
                      {children?.map((child) => (
                        <SelectItem key={child.id} value={child.id}>
                          {child.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-arabic">المادة</Label>
                    <Select value={subject} onValueChange={setSubject}>
                      <SelectTrigger data-testid="select-subject">
                        <SelectValue placeholder="اختر المادة" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-arabic">الصف</Label>
                    <Select value={grade} onValueChange={setGrade}>
                      <SelectTrigger data-testid="select-grade">
                        <SelectValue placeholder="اختر الصف" />
                      </SelectTrigger>
                      <SelectContent>
                        {grades.map((g) => (
                          <SelectItem key={g.value} value={g.value}>
                            {g.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-arabic">عنوان الفصل</Label>
                  <Input 
                    placeholder="مثال: الجمع والطرح"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    data-testid="input-chapter-title"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-arabic">صور صفحات الكتاب</CardTitle>
                <CardDescription className="font-arabic">
                  ارفع من 1 إلى 20 صورة (JPG, PNG - حد أقصى 10MB لكل صورة)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer hover:border-primary hover:bg-muted/50"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="dropzone-photos"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/heic,image/heif"
                    multiple
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                    data-testid="input-file-photos"
                  />
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="font-arabic text-muted-foreground mb-2">
                    اسحب الصور هنا أو انقر للاختيار
                  </p>
                  <p className="text-sm text-muted-foreground font-arabic">
                    {photos.length}/20 صورة
                  </p>
                </div>

                {photos.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-6">
                    {photos.map((photo) => (
                      <div key={photo.id} className="relative group aspect-square" data-testid={`photo-preview-${photo.id}`}>
                        <img
                          src={photo.preview}
                          alt={`صفحة ${photo.pageNumber}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <Button
                            variant="destructive"
                            size="icon"
                            className="w-8 h-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              removePhoto(photo.id);
                            }}
                            data-testid={`button-remove-photo-${photo.id}`}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <span className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded font-arabic">
                          {photo.pageNumber}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {isUploading && (
              <Card>
                <CardContent className="py-6">
                  <div className="flex items-center gap-4">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <div className="flex-1">
                      <p className="font-arabic font-medium mb-2">جاري رفع الصور...</p>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button
              className="w-full font-arabic h-12 text-lg"
              disabled={!canSubmit || isUploading}
              onClick={() => createChapterMutation.mutate()}
              data-testid="button-submit-chapter"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin ml-2" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <UploadIcon className="w-5 h-5 ml-2" />
                  إرسال للمعالجة
                </>
              )}
            </Button>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-arabic text-lg flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  نصائح للتصوير
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                      <tip.icon className="w-4 h-4 text-amber-600" />
                    </div>
                    <p className="text-sm font-arabic text-muted-foreground">{tip.text}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500 to-emerald-500 text-white border-0">
              <CardContent className="py-6">
                <BookOpen className="w-10 h-10 mb-3" />
                <h3 className="font-bold font-arabic mb-2">كيف يعمل؟</h3>
                <ol className="text-sm space-y-2 font-arabic opacity-90">
                  <li>1. ارفع صور صفحات الكتاب</li>
                  <li>2. الذكاء الاصطناعي يحلل المحتوى</li>
                  <li>3. يُنشئ شرح مبسط وأسئلة</li>
                  <li>4. طفلك يتعلم ويختبر فهمه</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
