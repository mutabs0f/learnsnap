import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Notification preferences type
export const notificationPreferencesSchema = z.object({
  chapterComplete: z.boolean().default(true),
  badgeEarned: z.boolean().default(true),
  weeklyReport: z.boolean().default(true),
  streakReminder: z.boolean().default(false),
});
export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;

// Users (Parents)
export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  subscriptionTier: text("subscription_tier").default("free"),
  subscriptionStatus: text("subscription_status").default("active"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  notificationPreferences: jsonb("notification_preferences").$type<NotificationPreferences>().default({ chapterComplete: true, badgeEarned: true, weeklyReport: true, streakReminder: false }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  fullName: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Children
export const children = pgTable("children", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  parentId: varchar("parent_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  avatarUrl: text("avatar_url"),
  totalStars: integer("total_stars").default(0),
  streak: integer("streak").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertChildSchema = createInsertSchema(children).pick({
  parentId: true,
  name: true,
  age: true,
  avatarUrl: true,
});

export type InsertChild = z.infer<typeof insertChildSchema>;
export type Child = typeof children.$inferSelect;

// Chapter Content Types
export const questionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).length(4),
  correct: z.enum(["A", "B", "C", "D"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
});

export const chapterContentSchema = z.object({
  subject: z.string(),
  grade: z.number(),
  topic: z.string(),
  explanation: z.object({
    paragraphs: z.array(z.string()),
  }),
  practice: z.array(questionSchema),
  test: z.array(questionSchema),
});

export type Question = z.infer<typeof questionSchema>;
export type ChapterContent = z.infer<typeof chapterContentSchema>;

// Chapters
export const chapters = pgTable("chapters", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id", { length: 36 }).notNull().references(() => children.id, { onDelete: "cascade" }),
  parentId: varchar("parent_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  grade: integer("grade").notNull(),
  content: jsonb("content").$type<ChapterContent>(),
  status: text("status").default("processing"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertChapterSchema = createInsertSchema(chapters).pick({
  childId: true,
  parentId: true,
  title: true,
  subject: true,
  grade: true,
});

export type InsertChapter = z.infer<typeof insertChapterSchema>;
export type Chapter = typeof chapters.$inferSelect;

// Chapter Results
export const chapterResults = pgTable("chapter_results", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  chapterId: varchar("chapter_id", { length: 36 }).notNull().references(() => chapters.id, { onDelete: "cascade" }),
  childId: varchar("child_id", { length: 36 }).notNull().references(() => children.id, { onDelete: "cascade" }),
  practiceScore: integer("practice_score"),
  testScore: integer("test_score"),
  totalScore: integer("total_score"),
  stars: integer("stars"),
  timeSpentSeconds: integer("time_spent_seconds"),
  answers: jsonb("answers").$type<{ practiceAnswers: string[]; testAnswers: string[] }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertChapterResultSchema = createInsertSchema(chapterResults).pick({
  chapterId: true,
  childId: true,
  practiceScore: true,
  testScore: true,
  totalScore: true,
  stars: true,
  timeSpentSeconds: true,
  answers: true,
});

export type InsertChapterResult = z.infer<typeof insertChapterResultSchema>;
export type ChapterResult = typeof chapterResults.$inferSelect;

// Chapter Photos
export const chapterPhotos = pgTable("chapter_photos", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  chapterId: varchar("chapter_id", { length: 36 }).notNull().references(() => chapters.id, { onDelete: "cascade" }),
  photoData: text("photo_data").notNull(),
  pageNumber: integer("page_number").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertChapterPhotoSchema = createInsertSchema(chapterPhotos).pick({
  chapterId: true,
  photoData: true,
  pageNumber: true,
});

export type InsertChapterPhoto = z.infer<typeof insertChapterPhotoSchema>;
export type ChapterPhoto = typeof chapterPhotos.$inferSelect;

// Learning Sessions - track detailed learning activity
export const learningSessions = pgTable("learning_sessions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id", { length: 36 }).notNull().references(() => children.id, { onDelete: "cascade" }),
  chapterId: varchar("chapter_id", { length: 36 }).notNull().references(() => chapters.id, { onDelete: "cascade" }),
  stage: text("stage").notNull(), // 'learn', 'practice', 'test'
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
  durationSeconds: integer("duration_seconds").default(0),
});

export const insertLearningSessionSchema = createInsertSchema(learningSessions).pick({
  childId: true,
  chapterId: true,
  stage: true,
});

export type InsertLearningSession = z.infer<typeof insertLearningSessionSchema>;
export type LearningSession = typeof learningSessions.$inferSelect;

// Badges - achievement types
export const badges = pgTable("badges", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  description: text("description").notNull(),
  descriptionAr: text("description_ar").notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  type: text("type").notNull(), // 'first_chapter', 'perfect_score', 'streak', 'subject_mastery', 'learning_time'
  requirement: integer("requirement").notNull(), // e.g., 7 for 7-day streak, 100 for perfect score
  rarity: text("rarity").default("common"), // 'common', 'rare', 'epic', 'legendary'
});

export const insertBadgeSchema = createInsertSchema(badges).omit({ id: true });
export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type Badge = typeof badges.$inferSelect;

// Child Badges - junction table for earned badges
export const childBadges = pgTable("child_badges", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id", { length: 36 }).notNull().references(() => children.id, { onDelete: "cascade" }),
  badgeId: varchar("badge_id", { length: 36 }).notNull().references(() => badges.id, { onDelete: "cascade" }),
  earnedAt: timestamp("earned_at").defaultNow(),
  notified: boolean("notified").default(false),
});

export const insertChildBadgeSchema = createInsertSchema(childBadges).pick({
  childId: true,
  badgeId: true,
});
export type InsertChildBadge = z.infer<typeof insertChildBadgeSchema>;
export type ChildBadge = typeof childBadges.$inferSelect;

// Subject icons and colors mapping
export const subjectConfig = {
  math: { icon: "Calculator", color: "from-blue-400 to-blue-600", emoji: "🔢" },
  science: { icon: "Beaker", color: "from-green-400 to-green-600", emoji: "🔬" },
  arabic: { icon: "BookOpen", color: "from-amber-400 to-amber-600", emoji: "📖" },
  english: { icon: "Globe", color: "from-purple-400 to-purple-600", emoji: "🌍" },
  islamic: { icon: "Moon", color: "from-emerald-400 to-emerald-600", emoji: "🌙" },
  social: { icon: "Users", color: "from-pink-400 to-pink-600", emoji: "👥" },
} as const;

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'chapter_complete', 'badge_earned', 'weekly_report', 'streak_reminder'
  title: text("title").notNull(),
  titleAr: text("title_ar").notNull(),
  message: text("message").notNull(),
  messageAr: text("message_ar").notNull(),
  data: jsonb("data").$type<{ childId?: string; chapterId?: string; badgeId?: string }>(),
  read: boolean("read").default(false),
  emailSent: boolean("email_sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, read: true, emailSent: true, createdAt: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Sample Chapters - pre-generated demo content library
export const sampleChapters = pgTable("sample_chapters", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  titleAr: text("title_ar").notNull(),
  subject: text("subject").notNull(),
  grade: integer("grade").notNull(),
  description: text("description").notNull(),
  descriptionAr: text("description_ar").notNull(),
  content: jsonb("content").$type<ChapterContent>(),
  previewImage: text("preview_image"),
  difficulty: text("difficulty").default("medium"), // 'easy', 'medium', 'hard'
  estimatedMinutes: integer("estimated_minutes").default(15),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSampleChapterSchema = createInsertSchema(sampleChapters).omit({ id: true, isActive: true, createdAt: true });
export type InsertSampleChapter = z.infer<typeof insertSampleChapterSchema>;
export type SampleChapter = typeof sampleChapters.$inferSelect;

// Predefined badge definitions for seeding
export const badgeDefinitions = [
  { name: "First Steps", nameAr: "أولى الخطوات", description: "Complete your first chapter", descriptionAr: "أكمل أول فصل لك", icon: "Footprints", color: "amber", type: "first_chapter", requirement: 1, rarity: "common" },
  { name: "Perfect Score", nameAr: "درجة مثالية", description: "Score 100% on a test", descriptionAr: "احصل على ١٠٠٪ في الاختبار", icon: "Star", color: "yellow", type: "perfect_score", requirement: 100, rarity: "rare" },
  { name: "Week Warrior", nameAr: "محارب الأسبوع", description: "7 day learning streak", descriptionAr: "سلسلة تعلم ٧ أيام", icon: "Flame", color: "orange", type: "streak", requirement: 7, rarity: "rare" },
  { name: "Month Master", nameAr: "سيد الشهر", description: "30 day learning streak", descriptionAr: "سلسلة تعلم ٣٠ يوم", icon: "Trophy", color: "purple", type: "streak", requirement: 30, rarity: "epic" },
  { name: "Math Wizard", nameAr: "ساحر الرياضيات", description: "Complete 10 math chapters", descriptionAr: "أكمل ١٠ فصول رياضيات", icon: "Calculator", color: "blue", type: "subject_mastery", requirement: 10, rarity: "epic" },
  { name: "Science Explorer", nameAr: "مستكشف العلوم", description: "Complete 10 science chapters", descriptionAr: "أكمل ١٠ فصول علوم", icon: "Beaker", color: "green", type: "subject_mastery", requirement: 10, rarity: "epic" },
  { name: "Bookworm", nameAr: "عاشق الكتب", description: "Read for 5 hours total", descriptionAr: "اقرأ لمدة ٥ ساعات", icon: "BookOpen", color: "teal", type: "learning_time", requirement: 18000, rarity: "rare" },
  { name: "Scholar", nameAr: "العالم", description: "Read for 20 hours total", descriptionAr: "اقرأ لمدة ٢٠ ساعة", icon: "GraduationCap", color: "indigo", type: "learning_time", requirement: 72000, rarity: "legendary" },
  { name: "Quick Learner", nameAr: "المتعلم السريع", description: "Complete 5 chapters", descriptionAr: "أكمل ٥ فصول", icon: "Zap", color: "cyan", type: "first_chapter", requirement: 5, rarity: "common" },
  { name: "Chapter Champion", nameAr: "بطل الفصول", description: "Complete 25 chapters", descriptionAr: "أكمل ٢٥ فصل", icon: "Crown", color: "gold", type: "first_chapter", requirement: 25, rarity: "legendary" },
];

// Sample chapter definitions for seeding
export const sampleChapterDefinitions: InsertSampleChapter[] = [
  {
    title: "Addition and Subtraction",
    titleAr: "الجمع والطرح",
    subject: "math",
    grade: 2,
    description: "Learn basic addition and subtraction with fun examples",
    descriptionAr: "تعلم الجمع والطرح الأساسي مع أمثلة ممتعة",
    difficulty: "easy",
    estimatedMinutes: 10,
    content: {
      subject: "math",
      grade: 2,
      topic: "الجمع والطرح",
      explanation: {
        paragraphs: [
          "الجمع هو عملية إضافة أعداد معًا. مثلاً: ٢ + ٣ = ٥",
          "الطرح هو عملية إنقاص عدد من عدد آخر. مثلاً: ٥ - ٢ = ٣",
          "يمكننا استخدام أصابعنا للعد والتأكد من الإجابة الصحيحة.",
          "لنتمرن معًا على بعض الأمثلة!"
        ]
      },
      practice: [
        { question: "ما ناتج ٣ + ٤؟", options: ["٥", "٦", "٧", "٨"], correct: "C", difficulty: "easy" },
        { question: "ما ناتج ٨ - ٣؟", options: ["٣", "٤", "٥", "٦"], correct: "C", difficulty: "easy" },
        { question: "ما ناتج ٥ + ٢؟", options: ["٦", "٧", "٨", "٩"], correct: "B", difficulty: "easy" },
        { question: "ما ناتج ٩ - ٤؟", options: ["٣", "٤", "٥", "٦"], correct: "C", difficulty: "easy" },
        { question: "ما ناتج ٦ + ١؟", options: ["٥", "٦", "٧", "٨"], correct: "C", difficulty: "easy" }
      ],
      test: [
        { question: "ما ناتج ٤ + ٥؟", options: ["٨", "٩", "١٠", "١١"], correct: "B", difficulty: "easy" },
        { question: "ما ناتج ٧ - ٢؟", options: ["٣", "٤", "٥", "٦"], correct: "C", difficulty: "easy" },
        { question: "ما ناتج ٢ + ٦؟", options: ["٦", "٧", "٨", "٩"], correct: "C", difficulty: "easy" },
        { question: "ما ناتج ١٠ - ٣؟", options: ["٥", "٦", "٧", "٨"], correct: "C", difficulty: "easy" },
        { question: "ما ناتج ٣ + ٣؟", options: ["٤", "٥", "٦", "٧"], correct: "C", difficulty: "easy" },
        { question: "ما ناتج ٨ - ٥؟", options: ["٢", "٣", "٤", "٥"], correct: "B", difficulty: "medium" },
        { question: "ما ناتج ٤ + ٤؟", options: ["٦", "٧", "٨", "٩"], correct: "C", difficulty: "easy" },
        { question: "ما ناتج ٩ - ٦؟", options: ["٢", "٣", "٤", "٥"], correct: "B", difficulty: "medium" },
        { question: "ما ناتج ٥ + ٥؟", options: ["٨", "٩", "١٠", "١١"], correct: "C", difficulty: "easy" },
        { question: "ما ناتج ٧ - ٤؟", options: ["٢", "٣", "٤", "٥"], correct: "B", difficulty: "easy" }
      ]
    }
  },
  {
    title: "The Solar System",
    titleAr: "المجموعة الشمسية",
    subject: "science",
    grade: 4,
    description: "Explore the planets and stars in our solar system",
    descriptionAr: "اكتشف الكواكب والنجوم في مجموعتنا الشمسية",
    difficulty: "medium",
    estimatedMinutes: 15,
    content: {
      subject: "science",
      grade: 4,
      topic: "المجموعة الشمسية",
      explanation: {
        paragraphs: [
          "المجموعة الشمسية تتكون من الشمس والكواكب التي تدور حولها.",
          "الشمس هي نجم كبير جداً يعطينا الضوء والحرارة.",
          "هناك ثمانية كواكب: عطارد، الزهرة، الأرض، المريخ، المشتري، زحل، أورانوس، ونبتون.",
          "الأرض هي الكوكب الوحيد الذي نعرف أن به حياة!"
        ]
      },
      practice: [
        { question: "ما هو أقرب كوكب للشمس؟", options: ["الزهرة", "عطارد", "الأرض", "المريخ"], correct: "B", difficulty: "easy" },
        { question: "كم عدد كواكب المجموعة الشمسية؟", options: ["٦", "٧", "٨", "٩"], correct: "C", difficulty: "easy" },
        { question: "ما هو أكبر كوكب في المجموعة الشمسية؟", options: ["زحل", "المشتري", "أورانوس", "نبتون"], correct: "B", difficulty: "medium" },
        { question: "أي كوكب يُعرف بالكوكب الأحمر؟", options: ["الزهرة", "المريخ", "المشتري", "زحل"], correct: "B", difficulty: "easy" },
        { question: "الشمس نجم أم كوكب؟", options: ["كوكب", "قمر", "نجم", "مذنب"], correct: "C", difficulty: "easy" }
      ],
      test: [
        { question: "ما هو ثالث كوكب من الشمس؟", options: ["عطارد", "الزهرة", "الأرض", "المريخ"], correct: "C", difficulty: "easy" },
        { question: "أي كوكب له حلقات مميزة؟", options: ["المشتري", "زحل", "أورانوس", "نبتون"], correct: "B", difficulty: "easy" },
        { question: "ما هو أبعد كوكب عن الشمس؟", options: ["أورانوس", "نبتون", "زحل", "المشتري"], correct: "B", difficulty: "medium" },
        { question: "كم عدد أقمار الأرض؟", options: ["٠", "١", "٢", "٣"], correct: "B", difficulty: "easy" },
        { question: "أي كوكب هو الأصغر؟", options: ["عطارد", "المريخ", "الزهرة", "الأرض"], correct: "A", difficulty: "medium" },
        { question: "ما هو الكوكب التوأم للأرض؟", options: ["المريخ", "الزهرة", "عطارد", "نبتون"], correct: "B", difficulty: "hard" },
        { question: "من أين تأتي الحرارة والضوء للأرض؟", options: ["القمر", "النجوم", "الشمس", "الكواكب"], correct: "C", difficulty: "easy" },
        { question: "ما هو ترتيب المريخ من الشمس؟", options: ["الثالث", "الرابع", "الخامس", "السادس"], correct: "B", difficulty: "medium" },
        { question: "أي كوكب يدور على جانبه؟", options: ["زحل", "نبتون", "أورانوس", "المشتري"], correct: "C", difficulty: "hard" },
        { question: "ما الذي يجعل الأرض مميزة؟", options: ["حجمها", "موقعها", "وجود الماء والحياة", "لونها"], correct: "C", difficulty: "easy" }
      ]
    }
  },
  {
    title: "Arabic Alphabet Review",
    titleAr: "مراجعة الحروف العربية",
    subject: "arabic",
    grade: 1,
    description: "Practice reading and writing Arabic letters",
    descriptionAr: "تدرب على قراءة وكتابة الحروف العربية",
    difficulty: "easy",
    estimatedMinutes: 10,
    content: {
      subject: "arabic",
      grade: 1,
      topic: "الحروف العربية",
      explanation: {
        paragraphs: [
          "اللغة العربية بها ٢٨ حرفًا جميلًا.",
          "كل حرف له شكل في أول الكلمة وفي وسطها وفي آخرها.",
          "الحروف الأولى هي: ألف، باء، تاء، ثاء...",
          "هيا نتعلم معًا ونتدرب على الحروف!"
        ]
      },
      practice: [
        { question: "ما هو أول حرف في الأبجدية العربية؟", options: ["باء", "ألف", "تاء", "جيم"], correct: "B", difficulty: "easy" },
        { question: "كم عدد الحروف العربية؟", options: ["٢٦", "٢٧", "٢٨", "٢٩"], correct: "C", difficulty: "easy" },
        { question: "أي حرف يأتي بعد الباء؟", options: ["ألف", "ثاء", "تاء", "جيم"], correct: "C", difficulty: "easy" },
        { question: "ما هو الحرف الذي يبدأ به كلمة 'شمس'؟", options: ["سين", "شين", "صاد", "ضاد"], correct: "B", difficulty: "easy" },
        { question: "أي من هذه الحروف له نقطة واحدة تحته؟", options: ["باء", "تاء", "ثاء", "نون"], correct: "A", difficulty: "medium" }
      ],
      test: [
        { question: "ما هو الحرف الأخير في الأبجدية؟", options: ["واو", "هاء", "ياء", "لام"], correct: "C", difficulty: "easy" },
        { question: "كم نقطة للحرف 'ث'؟", options: ["١", "٢", "٣", "٤"], correct: "C", difficulty: "easy" },
        { question: "أي حرف يشبه 'ب' لكن بنقطتين فوق؟", options: ["ت", "ث", "ن", "ي"], correct: "A", difficulty: "easy" },
        { question: "ما الحرف الذي يبدأ به كلمة 'قمر'؟", options: ["كاف", "قاف", "فاء", "غين"], correct: "B", difficulty: "easy" },
        { question: "أي حرف له نقطة فوقه؟", options: ["حاء", "خاء", "جيم", "ب و ج"], correct: "B", difficulty: "medium" },
        { question: "ما الحرف الذي يبدأ به كلمة 'بيت'؟", options: ["تاء", "باء", "ياء", "نون"], correct: "B", difficulty: "easy" },
        { question: "كم نقطة للحرف 'ش'؟", options: ["١", "٢", "٣", "٤"], correct: "C", difficulty: "easy" },
        { question: "أي حرف يأتي قبل 'ج'؟", options: ["ب", "ت", "ث", "ح"], correct: "C", difficulty: "medium" },
        { question: "ما الحرف الذي يبدأ به كلمة 'ماء'؟", options: ["نون", "ميم", "واو", "ألف"], correct: "B", difficulty: "easy" },
        { question: "الحرف 'ع' له نقاط؟", options: ["نعم، واحدة", "نعم، اثنتين", "نعم، ثلاث", "لا، بدون نقاط"], correct: "D", difficulty: "medium" }
      ]
    }
  }
];
