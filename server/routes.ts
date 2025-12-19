import type { Express, Request, Response } from "express";
import { type Server } from "http";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { processChapterWithAI, calculateScores } from "./ai-service";
import { stripeService } from "./stripeService";
import { getStripePublishableKey } from "./stripeClient";
import { insertUserSchema, insertChildSchema, insertChapterSchema } from "../shared/schema.js";
import { z } from "zod";
import { setChildCookie, clearChildCookie, requireChildAuth, requireChildAccess, setParentCookie, clearParentCookie, requireParentSession, verifyParentToken, type AuthRequest, type ChildRequest } from "./auth";
import { aiLimiter } from "./security";
import logger from "./logger";

const SALT_ROUNDS = 10;

export async function registerRoutes(httpServer: Server, app: Express): Promise<void> {
  // Health check endpoints
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      version: '1.2.0'
    });
  });

  app.get('/health/ready', async (req, res) => {
    try {
      await storage.healthCheck();
      
      const aiHealth = {
        gemini: !!(process.env.GEMINI_API_KEY || process.env.AI_INTEGRATIONS_GEMINI_API_KEY),
        openai: !!(process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY),
        anthropic: !!(process.env.ANTHROPIC_API_KEY || process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY),
      };
      
      const stripeReady = !!process.env.STRIPE_SECRET_KEY;
      
      res.json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        services: {
          database: 'ok',
          ai: aiHealth,
          stripe: stripeReady ? 'ok' : 'not configured'
        }
      });
    } catch (error) {
      logger.error('Health check failed', { error });
      res.status(503).json({
        status: 'not ready',
        error: 'Service unavailable',
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get('/health/live', (req, res) => {
    res.json({ 
      status: 'alive',
      timestamp: new Date().toISOString()
    });
  });
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      console.log('=== REGISTRATION ATTEMPT ===');
      console.log('Request body:', JSON.stringify(req.body));
      
      const data = insertUserSchema.parse(req.body);
      console.log('Parsed data:', { email: data.email, fullName: data.fullName, passwordLength: data.password?.length });
      
      console.log('Checking if user exists...');
      const existing = await storage.getUserByEmail(data.email);
      if (existing) {
        console.log('User already exists');
        return res.status(400).json({ error: "البريد الإلكتروني مسجل مسبقاً" });
      }
      console.log('User does not exist, proceeding...');

      // Hash the password before storing
      console.log('Hashing password...');
      const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
      console.log('Password hashed, length:', hashedPassword.length);
      
      console.log('Creating user in database...');
      const user = await storage.createUser({
        ...data,
        password: hashedPassword,
      });
      console.log('User created successfully:', user.id);
      
      // Set parent session cookie
      console.log('Setting parent cookie...');
      setParentCookie(res, user.id, user.email);
      
      console.log('=== REGISTRATION SUCCESS ===');
      res.json({ user: { id: user.id, email: user.email, fullName: user.fullName } });
    } catch (error: any) {
      console.error("=== REGISTRATION ERROR ===");
      console.error("Error type:", error?.constructor?.name);
      console.error("Error message:", error?.message);
      console.error("Error stack:", error?.stack);
      console.error("Full error:", error);
      res.status(500).json({ error: "فشل إنشاء الحساب", details: error?.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
      }

      // Compare password with hashed password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
      }

      // Set parent session cookie
      setParentCookie(res, user.id, user.email);

      res.json({ user: { id: user.id, email: user.email, fullName: user.fullName } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ error: "فشل تسجيل الدخول" });
    }
  });
  
  // Parent logout - clears parent session cookie
  app.post("/api/auth/logout", (req, res) => {
    clearParentCookie(res);
    res.json({ success: true });
  });

  // Child login - sets JWT token in httpOnly cookie
  // Requires parent session cookie for authentication
  app.post("/api/child/login", async (req: AuthRequest, res) => {
    try {
      const { childId } = req.body;
      
      if (!childId) {
        return res.status(400).json({ error: "معرف الطفل مطلوب" });
      }
      
      // Verify parent session from cookie
      const parentToken = req.cookies?.parentToken;
      if (!parentToken) {
        return res.status(401).json({ error: "يرجى تسجيل دخول الوالد أولاً" });
      }
      
      let parentId: string;
      try {
        const decoded = verifyParentToken(parentToken);
        parentId = decoded.userId;
      } catch (error) {
        return res.status(401).json({ error: "انتهت صلاحية الجلسة" });
      }
      
      // Verify child exists and belongs to this parent
      const child = await storage.getChildById(childId);
      if (!child || child.parentId !== parentId) {
        return res.status(403).json({ error: "ليس لديك صلاحية لهذا الطفل" });
      }
      
      // Set JWT token in httpOnly cookie
      setChildCookie(res, childId, parentId);
      
      res.json({ success: true, child: { id: child.id, name: child.name } });
    } catch (error) {
      console.error("Child login error:", error);
      res.status(500).json({ error: "فشل تسجيل دخول الطفل" });
    }
  });

  // Child logout - clears JWT cookie
  app.post("/api/child/logout", (req, res) => {
    clearChildCookie(res);
    res.json({ success: true });
  });

  // Get current child from JWT
  app.get("/api/child/me", requireChildAuth, async (req: ChildRequest, res) => {
    try {
      if (!req.child) {
        return res.status(401).json({ error: "غير مصرح" });
      }
      
      const child = await storage.getChildById(req.child.childId);
      if (!child) {
        return res.status(404).json({ error: "الطفل غير موجود" });
      }
      
      res.json(child);
    } catch (error) {
      console.error("Get current child error:", error);
      res.status(500).json({ error: "فشل جلب بيانات الطفل" });
    }
  });

  // Children routes - requires parent session
  app.get("/api/children", requireParentSession, async (req: AuthRequest, res) => {
    try {
      const parentId = req.authenticatedParentId;
      if (!parentId) {
        return res.status(401).json({ error: "غير مصرح" });
      }
      const childrenList = await storage.getChildrenByParent(parentId);
      res.json(childrenList);
    } catch (error) {
      console.error("Get children error:", error);
      res.status(500).json({ error: "فشل جلب الأطفال" });
    }
  });

  app.get("/api/children/:id", requireChildAccess, async (req: ChildRequest, res) => {
    try {
      const childId = req.authenticatedChildId || req.params.id;
      const child = await storage.getChildById(childId);
      if (!child) {
        return res.status(404).json({ error: "الطفل غير موجود" });
      }
      res.json(child);
    } catch (error) {
      console.error("Get child error:", error);
      res.status(500).json({ error: "فشل جلب الطفل" });
    }
  });

  app.get("/api/children/:childId/chapters", requireChildAccess, async (req: ChildRequest, res) => {
    try {
      const childId = req.authenticatedChildId || req.params.childId;
      const chaptersList = await storage.getChaptersByChild(childId);
      res.json(chaptersList);
    } catch (error) {
      console.error("Get child chapters error:", error);
      res.status(500).json({ error: "فشل جلب الفصول" });
    }
  });

  app.get("/api/children/:childId/results", requireChildAccess, async (req: ChildRequest, res) => {
    try {
      const childId = req.authenticatedChildId || req.params.childId;
      const results = await storage.getResultsByChild(childId);
      res.json(results);
    } catch (error) {
      console.error("Get child results error:", error);
      res.status(500).json({ error: "فشل جلب النتائج" });
    }
  });

  app.post("/api/children", requireParentSession, async (req: AuthRequest, res) => {
    try {
      const data = insertChildSchema.parse(req.body);
      // Verify parent is creating child for themselves
      if (data.parentId !== req.authenticatedParentId) {
        return res.status(403).json({ error: "ليس لديك صلاحية" });
      }
      const child = await storage.createChild(data);
      res.json(child);
    } catch (error) {
      console.error("Create child error:", error);
      res.status(400).json({ error: "فشل إضافة الطفل" });
    }
  });

  // Chapters routes - requires parent session
  app.get("/api/chapters", requireParentSession, async (req: AuthRequest, res) => {
    try {
      const parentId = req.authenticatedParentId;
      if (!parentId) {
        return res.status(401).json({ error: "غير مصرح" });
      }
      const chaptersList = await storage.getChaptersByParent(parentId);
      res.json(chaptersList);
    } catch (error) {
      console.error("Get chapters error:", error);
      res.status(500).json({ error: "فشل جلب الفصول" });
    }
  });

  app.get("/api/chapters/:id", requireChildAccess, async (req: ChildRequest, res) => {
    try {
      const chapter = await storage.getChapterById(req.params.id);
      if (!chapter) {
        return res.status(404).json({ error: "الفصل غير موجود" });
      }
      
      // Verify chapter belongs to authenticated context
      const childId = req.authenticatedChildId;
      const parentId = req.authenticatedParentId;
      if (childId && chapter.childId !== childId) {
        return res.status(403).json({ error: "ليس لديك صلاحية" });
      }
      if (parentId && chapter.parentId !== parentId) {
        return res.status(403).json({ error: "ليس لديك صلاحية" });
      }
      
      res.json(chapter);
    } catch (error) {
      console.error("Get chapter error:", error);
      res.status(500).json({ error: "فشل جلب الفصل" });
    }
  });

  app.get("/api/chapters/:id/result", requireChildAccess, async (req: ChildRequest, res) => {
    try {
      const chapter = await storage.getChapterById(req.params.id);
      if (!chapter) {
        return res.status(404).json({ error: "الفصل غير موجود" });
      }
      
      // Verify chapter belongs to authenticated context
      const childId = req.authenticatedChildId;
      const parentId = req.authenticatedParentId;
      if (childId && chapter.childId !== childId) {
        return res.status(403).json({ error: "ليس لديك صلاحية" });
      }
      if (parentId && chapter.parentId !== parentId) {
        return res.status(403).json({ error: "ليس لديك صلاحية" });
      }
      
      const result = await storage.getResultByChapter(req.params.id);
      if (!result) {
        return res.status(404).json({ error: "النتيجة غير موجودة" });
      }
      res.json(result);
    } catch (error) {
      console.error("Get chapter result error:", error);
      res.status(500).json({ error: "فشل جلب النتيجة" });
    }
  });

  const createChapterSchema = insertChapterSchema.extend({
    photos: z.array(z.object({
      photoData: z.string(),
      pageNumber: z.number(),
    })),
  });

  app.post("/api/chapters", requireParentSession, aiLimiter, async (req: AuthRequest, res) => {
    try {
      const data = createChapterSchema.parse(req.body);
      const { photos, ...chapterData } = data;
      
      // Verify parent is creating chapter for their own child
      if (chapterData.parentId !== req.authenticatedParentId) {
        return res.status(403).json({ error: "ليس لديك صلاحية" });
      }

      // Create the chapter
      const chapter = await storage.createChapter(chapterData);

      // Save photos
      if (photos.length > 0) {
        await storage.createChapterPhotos(chapter.id, photos);
      }

      // Start AI processing in background
      processChapterInBackground(chapter.id, photos.map(p => p.photoData), data.subject, data.grade);

      res.json({ chapter });
    } catch (error) {
      console.error("Create chapter error:", error);
      res.status(400).json({ error: "فشل إنشاء الفصل" });
    }
  });

  // Background processing function
  async function processChapterInBackground(chapterId: string, photos: string[], subject: string, grade: number) {
    try {
      console.log(`Starting AI processing for chapter ${chapterId}...`);
      
      const content = await processChapterWithAI(photos, subject, grade);
      
      await storage.updateChapterContent(chapterId, content);
      
      console.log(`Chapter ${chapterId} processed successfully!`);
    } catch (error) {
      console.error(`Failed to process chapter ${chapterId}:`, error);
      await storage.updateChapterStatus(chapterId, "error");
    }
  }

  // Submit answers
  const submitAnswersSchema = z.object({
    practiceAnswers: z.array(z.string()),
    testAnswers: z.array(z.string()),
  });

  app.post("/api/chapters/:id/submit", requireChildAccess, async (req: ChildRequest, res) => {
    try {
      const { practiceAnswers, testAnswers } = submitAnswersSchema.parse(req.body);
      const chapterId = req.params.id;

      const chapter = await storage.getChapterById(chapterId);
      if (!chapter || !chapter.content) {
        return res.status(404).json({ error: "الفصل غير موجود" });
      }
      
      // Verify chapter belongs to authenticated child
      const childId = req.authenticatedChildId;
      if (!childId || chapter.childId !== childId) {
        return res.status(403).json({ error: "ليس لديك صلاحية" });
      }

      const content = chapter.content;
      const { practiceScore, testScore, totalScore, stars } = calculateScores(
        practiceAnswers,
        testAnswers,
        content.practice,
        content.test
      );

      const result = await storage.createChapterResult({
        chapterId,
        childId: chapter.childId,
        practiceScore,
        testScore,
        totalScore,
        stars,
        timeSpentSeconds: 0, // TODO: track actual time
        answers: { practiceAnswers, testAnswers },
      });

      // Update chapter status
      await storage.updateChapterStatus(chapterId, "completed");

      // Update child's total stars
      const child = await storage.getChildById(chapter.childId);
      if (child) {
        await storage.updateChildStars(child.id, (child.totalStars || 0) + stars);
        
        // Create notification for parent about chapter completion
        const parentPrefs = await storage.getNotificationPreferences(chapter.parentId);
        if (parentPrefs?.chapterComplete !== false) {
          await storage.createNotification({
            userId: chapter.parentId,
            type: "chapter_complete",
            title: "Chapter Completed!",
            titleAr: "تم إكمال الفصل!",
            message: `${child.name} completed "${chapter.title}" with a score of ${totalScore}% and earned ${stars} stars!`,
            messageAr: `${child.name} أكمل "${chapter.title}" بنتيجة ${totalScore}٪ وحصل على ${stars} نجوم!`,
            data: { childId: child.id, chapterId },
          });
        }
      }

      res.json({ result });
    } catch (error) {
      console.error("Submit answers error:", error);
      res.status(400).json({ error: "فشل إرسال الإجابات" });
    }
  });

  // Results routes
  app.get("/api/results/:id", requireChildAccess, async (req: ChildRequest, res) => {
    try {
      const result = await storage.getResultById(req.params.id);
      if (!result) {
        return res.status(404).json({ error: "النتيجة غير موجودة" });
      }
      
      // Verify result belongs to authenticated context
      const childId = req.authenticatedChildId;
      const parentId = req.authenticatedParentId;
      if (childId && result.childId !== childId) {
        return res.status(403).json({ error: "ليس لديك صلاحية" });
      }
      // For parent, verify via chapter ownership
      if (parentId && !childId) {
        const chapter = await storage.getChapterById(result.chapterId);
        if (!chapter || chapter.parentId !== parentId) {
          return res.status(403).json({ error: "ليس لديك صلاحية" });
        }
      }
      
      res.json(result);
    } catch (error) {
      console.error("Get result error:", error);
      res.status(500).json({ error: "فشل جلب النتيجة" });
    }
  });

  // Stripe routes
  app.get("/api/stripe/config", async (req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      console.error("Get Stripe config error:", error);
      res.status(500).json({ error: "Failed to get Stripe config" });
    }
  });

  app.get("/api/stripe/products", async (req, res) => {
    try {
      const rows = await stripeService.listProductsWithPrices();
      
      const productsMap = new Map();
      for (const row of rows as any[]) {
        if (!productsMap.has(row.product_id)) {
          productsMap.set(row.product_id, {
            id: row.product_id,
            name: row.product_name,
            description: row.product_description,
            active: row.product_active,
            metadata: row.product_metadata,
            prices: []
          });
        }
        if (row.price_id) {
          productsMap.get(row.product_id).prices.push({
            id: row.price_id,
            unit_amount: row.unit_amount,
            currency: row.currency,
            recurring: row.recurring,
            active: row.price_active,
          });
        }
      }

      res.json({ data: Array.from(productsMap.values()) });
    } catch (error) {
      console.error("Get products error:", error);
      res.status(500).json({ error: "فشل جلب المنتجات" });
    }
  });

  app.get("/api/stripe/subscription", requireParentSession, async (req: AuthRequest, res) => {
    try {
      const userId = req.authenticatedParentId;
      if (!userId) {
        return res.status(401).json({ error: "غير مصرح" });
      }

      const user = await stripeService.getUser(userId);
      if (!user?.stripeSubscriptionId) {
        return res.json({ subscription: null });
      }

      const subscription = await stripeService.getSubscription(user.stripeSubscriptionId);
      res.json({ subscription });
    } catch (error) {
      console.error("Get subscription error:", error);
      res.status(500).json({ error: "فشل جلب الاشتراك" });
    }
  });

  app.post("/api/stripe/checkout", requireParentSession, async (req: AuthRequest, res) => {
    try {
      const userId = req.authenticatedParentId;
      const { priceId } = req.body;
      
      if (!userId || !priceId) {
        return res.status(400).json({ error: "priceId مطلوب" });
      }

      const user = await stripeService.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "المستخدم غير موجود" });
      }

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripeService.createCustomer(user.email, user.id, user.fullName);
        await stripeService.updateUserStripeInfo(user.id, { stripeCustomerId: customer.id });
        customerId = customer.id;
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const session = await stripeService.createCheckoutSession(
        customerId,
        priceId,
        `${baseUrl}/dashboard?subscription=success`,
        `${baseUrl}/dashboard?subscription=cancelled`
      );

      res.json({ url: session.url });
    } catch (error) {
      console.error("Create checkout error:", error);
      res.status(500).json({ error: "فشل إنشاء جلسة الدفع" });
    }
  });

  app.post("/api/stripe/portal", requireParentSession, async (req: AuthRequest, res) => {
    try {
      const userId = req.authenticatedParentId;
      if (!userId) {
        return res.status(401).json({ error: "غير مصرح" });
      }

      const user = await stripeService.getUser(userId);
      if (!user?.stripeCustomerId) {
        return res.status(400).json({ error: "لا يوجد حساب Stripe مرتبط" });
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const session = await stripeService.createCustomerPortalSession(
        user.stripeCustomerId,
        `${baseUrl}/dashboard`
      );

      res.json({ url: session.url });
    } catch (error) {
      console.error("Create portal error:", error);
      res.status(500).json({ error: "فشل فتح بوابة الاشتراك" });
    }
  });

  // Analytics routes - requires parent session
  app.get("/api/analytics/parent/:parentId", requireParentSession, async (req: AuthRequest, res) => {
    try {
      // Use authenticated parent ID, ignore URL param
      const parentId = req.authenticatedParentId;
      if (!parentId) {
        return res.status(401).json({ error: "غير مصرح" });
      }
      const analytics = await storage.getParentAnalytics(parentId);
      res.json(analytics);
    } catch (error) {
      console.error("Get parent analytics error:", error);
      res.status(500).json({ error: "فشل جلب التحليلات" });
    }
  });

  app.get("/api/analytics/child/:childId", requireChildAccess, async (req: ChildRequest, res) => {
    try {
      const childId = req.authenticatedChildId || req.params.childId;
      const analytics = await storage.getChildAnalytics(childId);
      res.json(analytics);
    } catch (error) {
      console.error("Get child analytics error:", error);
      res.status(500).json({ error: "فشل جلب تحليلات الطفل" });
    }
  });

  // Learning session tracking
  const startSessionSchema = z.object({
    childId: z.string().min(1),
    chapterId: z.string().min(1),
    stage: z.enum(["learn", "practice", "test"]),
  });

  app.post("/api/sessions/start", requireChildAccess, async (req: ChildRequest, res) => {
    try {
      const data = startSessionSchema.parse(req.body);
      
      // Verify childId matches authenticated context
      const authenticatedChildId = req.authenticatedChildId;
      const authenticatedParentId = req.authenticatedParentId;
      
      if (authenticatedChildId) {
        // Child session: use authenticated childId, ignore body.childId
        if (data.childId !== authenticatedChildId) {
          return res.status(403).json({ error: "ليس لديك صلاحية" });
        }
      } else if (authenticatedParentId) {
        // Parent session: verify child belongs to parent
        const child = await storage.getChildById(data.childId);
        if (!child || child.parentId !== authenticatedParentId) {
          return res.status(403).json({ error: "ليس لديك صلاحية" });
        }
      }
      
      // Verify chapter belongs to the child
      const chapter = await storage.getChapterById(data.chapterId);
      if (!chapter || chapter.childId !== data.childId) {
        return res.status(403).json({ error: "ليس لديك صلاحية" });
      }
      
      const session = await storage.createLearningSession(data);
      res.json(session);
    } catch (error) {
      console.error("Start session error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "بيانات غير صالحة" });
      }
      res.status(500).json({ error: "فشل بدء الجلسة" });
    }
  });

  const endSessionSchema = z.object({
    durationSeconds: z.number().min(0),
  });

  app.post("/api/sessions/:id/end", requireChildAccess, async (req: ChildRequest, res) => {
    try {
      const data = endSessionSchema.parse(req.body);
      
      // Verify session belongs to authenticated context
      const session = await storage.getLearningSessionById(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "الجلسة غير موجودة" });
      }
      
      const authenticatedChildId = req.authenticatedChildId;
      const authenticatedParentId = req.authenticatedParentId;
      
      if (authenticatedChildId && session.childId !== authenticatedChildId) {
        return res.status(403).json({ error: "ليس لديك صلاحية" });
      }
      if (authenticatedParentId && !authenticatedChildId) {
        const child = await storage.getChildById(session.childId);
        if (!child || child.parentId !== authenticatedParentId) {
          return res.status(403).json({ error: "ليس لديك صلاحية" });
        }
      }
      
      await storage.endLearningSession(req.params.id, data.durationSeconds);
      res.json({ success: true });
    } catch (error) {
      console.error("End session error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "بيانات غير صالحة" });
      }
      res.status(500).json({ error: "فشل إنهاء الجلسة" });
    }
  });

  // Badge routes
  app.get("/api/badges", async (req, res) => {
    try {
      const badgesList = await storage.getAllBadges();
      res.json(badgesList);
    } catch (error) {
      console.error("Get badges error:", error);
      res.status(500).json({ error: "فشل جلب الشارات" });
    }
  });

  const childIdParamSchema = z.object({
    id: z.string().min(1),
  });

  app.get("/api/children/:id/badges", requireChildAccess, async (req: ChildRequest, res) => {
    try {
      const childId = req.authenticatedChildId || req.params.id;
      const child = await storage.getChildById(childId);
      if (!child) {
        return res.status(404).json({ error: "الطفل غير موجود" });
      }
      const childBadgesList = await storage.getChildBadges(childId);
      res.json(childBadgesList);
    } catch (error) {
      console.error("Get child badges error:", error);
      res.status(500).json({ error: "فشل جلب شارات الطفل" });
    }
  });

  app.post("/api/children/:id/check-badges", requireChildAccess, async (req: ChildRequest, res) => {
    try {
      const childId = req.authenticatedChildId || req.params.id;
      const child = await storage.getChildById(childId);
      if (!child) {
        return res.status(404).json({ error: "الطفل غير موجود" });
      }
      const newBadges = await storage.checkAndAwardBadges(childId);
      res.json(newBadges);
    } catch (error) {
      console.error("Check badges error:", error);
      res.status(500).json({ error: "فشل التحقق من الشارات" });
    }
  });

  const parentIdParamSchema = z.object({
    id: z.string().min(1),
  });

  app.get("/api/parents/:id/leaderboard", requireParentSession, async (req: AuthRequest, res) => {
    try {
      // Use authenticated parent ID
      const parentId = req.authenticatedParentId;
      if (!parentId) {
        return res.status(401).json({ error: "غير مصرح" });
      }
      const leaderboard = await storage.getSiblingLeaderboard(parentId);
      res.json(leaderboard);
    } catch (error) {
      console.error("Get leaderboard error:", error);
      res.status(500).json({ error: "فشل جلب لوحة المتصدرين" });
    }
  });

  // Notification routes
  const userIdParamSchema = z.object({
    userId: z.string().min(1),
  });

  app.get("/api/users/:userId/notifications", requireParentSession, async (req: AuthRequest, res) => {
    try {
      const userId = req.authenticatedParentId;
      if (!userId) {
        return res.status(401).json({ error: "غير مصرح" });
      }
      const notificationsList = await storage.getNotificationsByUser(userId);
      res.json(notificationsList);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ error: "فشل جلب الإشعارات" });
    }
  });

  app.get("/api/users/:userId/notifications/unread-count", requireParentSession, async (req: AuthRequest, res) => {
    try {
      const userId = req.authenticatedParentId;
      if (!userId) {
        return res.status(401).json({ error: "غير مصرح" });
      }
      const count = await storage.getUnreadCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Get unread count error:", error);
      res.status(500).json({ error: "فشل جلب عدد الإشعارات" });
    }
  });

  const notificationIdParamSchema = z.object({
    id: z.string().min(1),
  });

  app.patch("/api/notifications/:id/read", requireParentSession, async (req: AuthRequest, res) => {
    try {
      const { id } = notificationIdParamSchema.parse(req.params);
      // Verify the notification belongs to the authenticated parent
      const notification = await storage.getNotificationById(id);
      if (!notification || notification.userId !== req.authenticatedParentId) {
        return res.status(403).json({ error: "ليس لديك صلاحية" });
      }
      await storage.markNotificationRead(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark notification read error:", error);
      res.status(500).json({ error: "فشل تحديث الإشعار" });
    }
  });

  app.patch("/api/users/:userId/notifications/read-all", requireParentSession, async (req: AuthRequest, res) => {
    try {
      const userId = req.authenticatedParentId;
      if (!userId) {
        return res.status(401).json({ error: "غير مصرح" });
      }
      await storage.markAllNotificationsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark all read error:", error);
      res.status(500).json({ error: "فشل تحديث الإشعارات" });
    }
  });

  const notificationPreferencesSchema = z.object({
    chapterComplete: z.boolean().default(true),
    badgeEarned: z.boolean().default(true),
    weeklyReport: z.boolean().default(true),
    streakReminder: z.boolean().default(false),
  });

  app.get("/api/users/:userId/notification-preferences", requireParentSession, async (req: AuthRequest, res) => {
    try {
      const userId = req.authenticatedParentId;
      if (!userId) {
        return res.status(401).json({ error: "غير مصرح" });
      }
      const preferences = await storage.getNotificationPreferences(userId);
      res.json(preferences || { chapterComplete: true, badgeEarned: true, weeklyReport: true, streakReminder: false });
    } catch (error) {
      console.error("Get preferences error:", error);
      res.status(500).json({ error: "فشل جلب الإعدادات" });
    }
  });

  app.patch("/api/users/:userId/notification-preferences", requireParentSession, async (req: AuthRequest, res) => {
    try {
      const userId = req.authenticatedParentId;
      if (!userId) {
        return res.status(401).json({ error: "غير مصرح" });
      }
      const preferences = notificationPreferencesSchema.parse(req.body);
      await storage.updateNotificationPreferences(userId, preferences);
      res.json({ success: true });
    } catch (error) {
      console.error("Update preferences error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "بيانات غير صالحة" });
      }
      res.status(500).json({ error: "فشل تحديث الإعدادات" });
    }
  });

  // ============= Sample Chapters / Content Library Routes =============
  
  const sampleChaptersQuerySchema = z.object({
    subject: z.string().optional(),
    grade: z.string().regex(/^\d+$/, "يجب أن يكون الصف رقماً").optional(),
  });

  app.get("/api/sample-chapters", async (req, res) => {
    try {
      const parseResult = sampleChaptersQuerySchema.safeParse(req.query);
      if (!parseResult.success) {
        return res.status(400).json({ error: "معايير البحث غير صالحة" });
      }
      
      const { subject, grade } = parseResult.data;
      
      let samples = await storage.getSampleChapters();
      
      if (subject) {
        samples = samples.filter(s => s.subject === subject);
      }
      
      if (grade) {
        const gradeNum = parseInt(grade, 10);
        samples = samples.filter(s => s.grade === gradeNum);
      }
      
      res.json(samples);
    } catch (error) {
      console.error("Get sample chapters error:", error);
      res.status(500).json({ error: "فشل جلب المحتوى التعليمي" });
    }
  });

  const sampleChapterIdSchema = z.object({
    sampleId: z.string().min(1),
  });

  app.get("/api/sample-chapters/:sampleId", async (req, res) => {
    try {
      const { sampleId } = sampleChapterIdSchema.parse(req.params);
      const sample = await storage.getSampleChapterById(sampleId);
      
      if (!sample) {
        return res.status(404).json({ error: "الفصل غير موجود" });
      }
      
      res.json(sample);
    } catch (error) {
      console.error("Get sample chapter error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "معرف غير صالح" });
      }
      res.status(500).json({ error: "فشل جلب الفصل" });
    }
  });

  const assignSampleChapterSchema = z.object({
    childId: z.string().min(1),
    parentId: z.string().min(1),
  });

  app.post("/api/sample-chapters/:sampleId/assign", async (req, res) => {
    try {
      const { sampleId } = sampleChapterIdSchema.parse(req.params);
      const { childId, parentId } = assignSampleChapterSchema.parse(req.body);
      
      const sample = await storage.getSampleChapterById(sampleId);
      if (!sample) {
        return res.status(404).json({ error: "الفصل غير موجود" });
      }
      
      const child = await storage.getChildById(childId);
      if (!child || child.parentId !== parentId) {
        return res.status(403).json({ error: "ليس لديك صلاحية لهذا الطفل" });
      }
      
      const chapter = await storage.assignSampleChapterToChild(sampleId, childId, parentId);
      res.json(chapter);
    } catch (error) {
      console.error("Assign sample chapter error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "بيانات غير صالحة" });
      }
      res.status(500).json({ error: "فشل إسناد الفصل" });
    }
  });

  // Health check endpoints
  app.get("/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development"
    });
  });

  app.get("/health/ready", async (req, res) => {
    try {
      // Check database by performing a simple query
      await storage.healthCheck();
      
      // Check AI services availability (supports both standard and Replit keys)
      const aiHealth = {
        gemini: !!(process.env.GEMINI_API_KEY || process.env.AI_INTEGRATIONS_GEMINI_API_KEY),
        openai: !!(process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY),
        anthropic: !!(process.env.ANTHROPIC_API_KEY || process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY),
      };
      
      res.json({
        status: "ready",
        services: {
          database: "ok",
          ai: aiHealth
        }
      });
    } catch (error) {
      console.error("Health check failed:", error);
      res.status(503).json({
        status: "not ready",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/health/live", (req, res) => {
    res.json({ status: "alive" });
  });
}
