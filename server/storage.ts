import { db } from "./db";
import { eq, and, desc, sql, gte } from "drizzle-orm";
import {
  users,
  children,
  chapters,
  chapterResults,
  chapterPhotos,
  learningSessions,
  badges,
  childBadges,
  notifications,
  sampleChapters,
  badgeDefinitions,
  sampleChapterDefinitions,
  type User,
  type InsertUser,
  type Child,
  type InsertChild,
  type Chapter,
  type InsertChapter,
  type ChapterResult,
  type InsertChapterResult,
  type ChapterPhoto,
  type InsertChapterPhoto,
  type ChapterContent,
  type LearningSession,
  type InsertLearningSession,
  type Badge,
  type InsertBadge,
  type ChildBadge,
  type InsertChildBadge,
  type Notification,
  type InsertNotification,
  type NotificationPreferences,
  type SampleChapter,
  type InsertSampleChapter,
} from "../shared/schema.js";

export interface IStorage {
  // Health check
  healthCheck(): Promise<void>;
  
  // Users
  createUser(data: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;

  // Children
  createChild(data: InsertChild): Promise<Child>;
  getChildrenByParent(parentId: string): Promise<Child[]>;
  getChildById(id: string): Promise<Child | undefined>;
  updateChildStars(id: string, stars: number): Promise<void>;
  updateChildStreak(id: string, streak: number): Promise<void>;

  // Chapters
  createChapter(data: InsertChapter): Promise<Chapter>;
  getChapterById(id: string): Promise<Chapter | undefined>;
  getChaptersByParent(parentId: string): Promise<Chapter[]>;
  getChaptersByChild(childId: string): Promise<Chapter[]>;
  updateChapterStatus(id: string, status: string): Promise<void>;
  updateChapterContent(id: string, content: ChapterContent): Promise<void>;

  // Chapter Photos
  createChapterPhotos(chapterId: string, photos: { photoData: string; pageNumber: number }[]): Promise<ChapterPhoto[]>;
  getPhotosByChapter(chapterId: string): Promise<ChapterPhoto[]>;

  // Chapter Results
  createChapterResult(data: InsertChapterResult): Promise<ChapterResult>;
  getResultByChapter(chapterId: string): Promise<ChapterResult | undefined>;
  getResultById(id: string): Promise<ChapterResult | undefined>;
  getResultsByChild(childId: string): Promise<ChapterResult[]>;

  // Learning Sessions
  createLearningSession(data: InsertLearningSession): Promise<LearningSession>;
  getLearningSessionById(id: string): Promise<LearningSession | undefined>;
  endLearningSession(id: string, durationSeconds: number): Promise<void>;
  getSessionsByChild(childId: string): Promise<LearningSession[]>;

  // Analytics
  getChildAnalytics(childId: string): Promise<{
    totalLearningTime: number;
    subjectPerformance: { subject: string; avgScore: number; count: number }[];
    weeklyProgress: { date: string; chaptersCompleted: number; learningTime: number }[];
    recentActivity: { date: string; chapterTitle: string; score: number; timeSpent: number }[];
  }>;
  getParentAnalytics(parentId: string): Promise<{
    childrenStats: { childId: string; name: string; totalChapters: number; avgScore: number; totalTime: number }[];
    subjectOverview: { subject: string; avgScore: number; totalChapters: number }[];
  }>;

  // Badges
  getAllBadges(): Promise<Badge[]>;
  getBadgeById(id: string): Promise<Badge | undefined>;
  createBadge(data: InsertBadge): Promise<Badge>;
  seedBadges(): Promise<void>;
  getChildBadges(childId: string): Promise<(ChildBadge & { badge: Badge })[]>;
  awardBadge(childId: string, badgeId: string): Promise<ChildBadge | null>;
  checkAndAwardBadges(childId: string): Promise<Badge[]>;
  getSiblingLeaderboard(parentId: string): Promise<{ childId: string; name: string; totalStars: number; badgeCount: number; rank: number }[]>;

  // Notifications
  createNotification(data: InsertNotification): Promise<Notification>;
  getNotificationById(id: string): Promise<Notification | undefined>;
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
  getUnreadCount(userId: string): Promise<number>;
  updateNotificationPreferences(userId: string, preferences: NotificationPreferences): Promise<void>;
  getNotificationPreferences(userId: string): Promise<NotificationPreferences | null>;

  // Sample Chapters
  getSampleChapters(): Promise<SampleChapter[]>;
  getSampleChapterById(id: string): Promise<SampleChapter | undefined>;
  getSampleChaptersBySubject(subject: string): Promise<SampleChapter[]>;
  getSampleChaptersByGrade(grade: number): Promise<SampleChapter[]>;
  seedSampleChapters(): Promise<void>;
  assignSampleChapterToChild(sampleChapterId: string, childId: string, parentId: string): Promise<Chapter>;
  
  // Health Check
  healthCheck(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async createUser(data: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  // Children
  async createChild(data: InsertChild): Promise<Child> {
    const [child] = await db.insert(children).values(data).returning();
    return child;
  }

  async getChildrenByParent(parentId: string): Promise<Child[]> {
    return db.select().from(children).where(eq(children.parentId, parentId));
  }

  async getChildById(id: string): Promise<Child | undefined> {
    const [child] = await db.select().from(children).where(eq(children.id, id));
    return child;
  }

  async updateChildStars(id: string, stars: number): Promise<void> {
    await db.update(children).set({ totalStars: stars }).where(eq(children.id, id));
  }

  async updateChildStreak(id: string, streak: number): Promise<void> {
    await db.update(children).set({ streak }).where(eq(children.id, id));
  }

  // Chapters
  async createChapter(data: InsertChapter): Promise<Chapter> {
    const [chapter] = await db.insert(chapters).values(data).returning();
    return chapter;
  }

  async getChapterById(id: string): Promise<Chapter | undefined> {
    const [chapter] = await db.select().from(chapters).where(eq(chapters.id, id));
    return chapter;
  }

  async getChaptersByParent(parentId: string): Promise<Chapter[]> {
    return db.select().from(chapters).where(eq(chapters.parentId, parentId)).orderBy(desc(chapters.createdAt));
  }

  async getChaptersByChild(childId: string): Promise<Chapter[]> {
    return db.select().from(chapters).where(eq(chapters.childId, childId)).orderBy(desc(chapters.createdAt));
  }

  async updateChapterStatus(id: string, status: string): Promise<void> {
    const updateData: any = { status };
    if (status === "completed") {
      updateData.completedAt = new Date();
    }
    await db.update(chapters).set(updateData).where(eq(chapters.id, id));
  }

  async updateChapterContent(id: string, content: ChapterContent): Promise<void> {
    await db.update(chapters).set({ content, status: "ready" }).where(eq(chapters.id, id));
  }

  // Chapter Photos
  async createChapterPhotos(chapterId: string, photos: { photoData: string; pageNumber: number }[]): Promise<ChapterPhoto[]> {
    const photosData = photos.map((p) => ({
      chapterId,
      photoData: p.photoData,
      pageNumber: p.pageNumber,
    }));
    return db.insert(chapterPhotos).values(photosData).returning();
  }

  async getPhotosByChapter(chapterId: string): Promise<ChapterPhoto[]> {
    return db.select().from(chapterPhotos).where(eq(chapterPhotos.chapterId, chapterId));
  }

  // Chapter Results
  async createChapterResult(data: InsertChapterResult): Promise<ChapterResult> {
    const [result] = await db.insert(chapterResults).values(data).returning();
    return result;
  }

  async getResultByChapter(chapterId: string): Promise<ChapterResult | undefined> {
    const [result] = await db.select().from(chapterResults).where(eq(chapterResults.chapterId, chapterId));
    return result;
  }

  async getResultById(id: string): Promise<ChapterResult | undefined> {
    const [result] = await db.select().from(chapterResults).where(eq(chapterResults.id, id));
    return result;
  }

  async getResultsByChild(childId: string): Promise<ChapterResult[]> {
    return db.select().from(chapterResults).where(eq(chapterResults.childId, childId));
  }

  // Learning Sessions
  async createLearningSession(data: InsertLearningSession): Promise<LearningSession> {
    const [session] = await db.insert(learningSessions).values(data).returning();
    return session;
  }

  async getLearningSessionById(id: string): Promise<LearningSession | undefined> {
    const [session] = await db.select().from(learningSessions).where(eq(learningSessions.id, id));
    return session;
  }

  async endLearningSession(id: string, durationSeconds: number): Promise<void> {
    await db.update(learningSessions).set({
      endedAt: new Date(),
      durationSeconds,
    }).where(eq(learningSessions.id, id));
  }

  async getSessionsByChild(childId: string): Promise<LearningSession[]> {
    return db.select().from(learningSessions).where(eq(learningSessions.childId, childId)).orderBy(desc(learningSessions.startedAt));
  }

  // Analytics
  async getChildAnalytics(childId: string): Promise<{
    totalLearningTime: number;
    subjectPerformance: { subject: string; avgScore: number; count: number }[];
    weeklyProgress: { date: string; chaptersCompleted: number; learningTime: number }[];
    recentActivity: { date: string; chapterTitle: string; score: number; timeSpent: number }[];
  }> {
    // Get total learning time
    const sessions = await db.select().from(learningSessions).where(eq(learningSessions.childId, childId));
    const totalLearningTime = sessions.reduce((sum: number, s: LearningSession) => sum + (s.durationSeconds || 0), 0);

    // Get all results with chapter info
    const results = await db.select({
      result: chapterResults,
      chapter: chapters,
    })
      .from(chapterResults)
      .innerJoin(chapters, eq(chapterResults.chapterId, chapters.id))
      .where(eq(chapterResults.childId, childId))
      .orderBy(desc(chapterResults.createdAt));

    // Calculate subject performance
    const subjectMap = new Map<string, { total: number; count: number }>();
    results.forEach(({ result, chapter }: { result: ChapterResult; chapter: Chapter }) => {
      const subject = chapter.subject;
      const score = result.totalScore || 0;
      const existing = subjectMap.get(subject) || { total: 0, count: 0 };
      subjectMap.set(subject, { total: existing.total + score, count: existing.count + 1 });
    });
    const subjectPerformance = Array.from(subjectMap.entries()).map(([subject, data]) => ({
      subject,
      avgScore: Math.round(data.total / data.count),
      count: data.count,
    }));

    // Calculate weekly progress (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const weeklyProgress: { date: string; chaptersCompleted: number; learningTime: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayResults = results.filter((r: { result: ChapterResult; chapter: Chapter }) => 
        r.result.createdAt && r.result.createdAt.toISOString().split('T')[0] === dateStr
      );
      const daySessions = sessions.filter((s: LearningSession) => 
        s.startedAt && s.startedAt.toISOString().split('T')[0] === dateStr
      );
      
      weeklyProgress.push({
        date: dateStr,
        chaptersCompleted: dayResults.length,
        learningTime: daySessions.reduce((sum: number, s: LearningSession) => sum + (s.durationSeconds || 0), 0),
      });
    }

    // Recent activity (last 5)
    const recentActivity = results.slice(0, 5).map(({ result, chapter }: { result: ChapterResult; chapter: Chapter }) => ({
      date: result.createdAt?.toISOString().split('T')[0] || '',
      chapterTitle: chapter.title,
      score: result.totalScore || 0,
      timeSpent: result.timeSpentSeconds || 0,
    }));

    return { totalLearningTime, subjectPerformance, weeklyProgress, recentActivity };
  }

  // Get analytics for all children of a parent
  async getParentAnalytics(parentId: string): Promise<{
    childrenStats: { childId: string; name: string; totalChapters: number; avgScore: number; totalTime: number }[];
    subjectOverview: { subject: string; avgScore: number; totalChapters: number }[];
  }> {
    const childrenList = await this.getChildrenByParent(parentId);
    
    const childrenStats = await Promise.all(childrenList.map(async (child) => {
      const results = await this.getResultsByChild(child.id);
      const sessions = await this.getSessionsByChild(child.id);
      
      const totalScore = results.reduce((sum, r) => sum + (r.totalScore || 0), 0);
      const avgScore = results.length > 0 ? Math.round(totalScore / results.length) : 0;
      const totalTime = sessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
      
      return {
        childId: child.id,
        name: child.name,
        totalChapters: results.length,
        avgScore,
        totalTime,
      };
    }));

    // Calculate overall subject overview
    const allChaptersList = await this.getChaptersByParent(parentId);
    const allResults = await Promise.all(
      childrenList.map(child => this.getResultsByChild(child.id))
    );
    const flatResults = allResults.flat();

    const subjectMap = new Map<string, { total: number; count: number }>();
    for (const result of flatResults) {
      const chapter = allChaptersList.find(c => c.id === result.chapterId);
      if (chapter) {
        const existing = subjectMap.get(chapter.subject) || { total: 0, count: 0 };
        subjectMap.set(chapter.subject, { 
          total: existing.total + (result.totalScore || 0), 
          count: existing.count + 1 
        });
      }
    }

    const subjectOverview = Array.from(subjectMap.entries()).map(([subject, data]) => ({
      subject,
      avgScore: data.count > 0 ? Math.round(data.total / data.count) : 0,
      totalChapters: data.count,
    }));

    return { childrenStats, subjectOverview };
  }

  // Badge methods
  async getAllBadges(): Promise<Badge[]> {
    return db.select().from(badges);
  }

  async getBadgeById(id: string): Promise<Badge | undefined> {
    const [badge] = await db.select().from(badges).where(eq(badges.id, id));
    return badge;
  }

  async createBadge(data: InsertBadge): Promise<Badge> {
    const [badge] = await db.insert(badges).values(data).returning();
    return badge;
  }

  async seedBadges(): Promise<void> {
    const existingBadges = await this.getAllBadges();
    if (existingBadges.length === 0) {
      for (const badgeDef of badgeDefinitions) {
        await this.createBadge(badgeDef);
      }
    }
  }

  async getChildBadges(childId: string): Promise<(ChildBadge & { badge: Badge })[]> {
    const results = await db
      .select()
      .from(childBadges)
      .innerJoin(badges, eq(childBadges.badgeId, badges.id))
      .where(eq(childBadges.childId, childId))
      .orderBy(desc(childBadges.earnedAt));
    
    return results.map(r => ({ ...r.child_badges, badge: r.badges }));
  }

  async awardBadge(childId: string, badgeId: string): Promise<ChildBadge | null> {
    // Check if already awarded
    const existing = await db
      .select()
      .from(childBadges)
      .where(and(eq(childBadges.childId, childId), eq(childBadges.badgeId, badgeId)));
    
    if (existing.length > 0) {
      return null; // Already has this badge
    }
    
    const [childBadge] = await db.insert(childBadges).values({ childId, badgeId }).returning();
    return childBadge;
  }

  async checkAndAwardBadges(childId: string): Promise<Badge[]> {
    const allBadges = await this.getAllBadges();
    const earnedBadges = await this.getChildBadges(childId);
    const earnedBadgeIds = new Set(earnedBadges.map(cb => cb.badgeId));
    
    const child = await this.getChildById(childId);
    if (!child) return [];
    
    const results = await this.getResultsByChild(childId);
    const sessions = await this.getSessionsByChild(childId);
    const totalLearningTime = sessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
    
    // Get chapters to check subjects
    const chapters = await this.getChaptersByChild(childId);
    const subjectCounts = new Map<string, number>();
    for (const chapter of chapters) {
      const count = subjectCounts.get(chapter.subject) || 0;
      subjectCounts.set(chapter.subject, count + 1);
    }
    
    const newlyEarned: Badge[] = [];
    
    for (const badge of allBadges) {
      if (earnedBadgeIds.has(badge.id)) continue;
      
      let earned = false;
      
      switch (badge.type) {
        case 'first_chapter':
          earned = results.length >= badge.requirement;
          break;
        case 'perfect_score':
          earned = results.some(r => r.totalScore === 100);
          break;
        case 'streak':
          earned = (child.streak || 0) >= badge.requirement;
          break;
        case 'learning_time':
          earned = totalLearningTime >= badge.requirement;
          break;
        case 'subject_mastery':
          if (badge.name.toLowerCase().includes('math')) {
            earned = (subjectCounts.get('math') || 0) >= badge.requirement;
          } else if (badge.name.toLowerCase().includes('science')) {
            earned = (subjectCounts.get('science') || 0) >= badge.requirement;
          }
          break;
      }
      
      if (earned) {
        await this.awardBadge(childId, badge.id);
        newlyEarned.push(badge);
      }
    }
    
    return newlyEarned;
  }

  async getSiblingLeaderboard(parentId: string): Promise<{ childId: string; name: string; totalStars: number; badgeCount: number; rank: number }[]> {
    const childrenList = await this.getChildrenByParent(parentId);
    
    const leaderboard = await Promise.all(childrenList.map(async (child) => {
      const childBadgesList = await this.getChildBadges(child.id);
      return {
        childId: child.id,
        name: child.name,
        totalStars: child.totalStars || 0,
        badgeCount: childBadgesList.length,
        rank: 0,
      };
    }));
    
    // Sort by stars, then badge count
    leaderboard.sort((a, b) => {
      if (b.totalStars !== a.totalStars) return b.totalStars - a.totalStars;
      return b.badgeCount - a.badgeCount;
    });
    
    // Assign ranks
    leaderboard.forEach((item, index) => {
      item.rank = index + 1;
    });
    
    return leaderboard;
  }

  // Notifications
  async createNotification(data: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(data).returning();
    return notification;
  }

  async getNotificationById(id: string): Promise<Notification | undefined> {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
    return notification;
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationRead(id: string): Promise<void> {
    await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications).set({ read: true }).where(eq(notifications.userId, userId));
  }

  async getUnreadCount(userId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
    return result[0]?.count || 0;
  }

  async updateNotificationPreferences(userId: string, preferences: NotificationPreferences): Promise<void> {
    await db.update(users).set({ notificationPreferences: preferences }).where(eq(users.id, userId));
  }

  async getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
    const user = await this.getUserById(userId);
    return user?.notificationPreferences || null;
  }

  // Sample Chapters
  async getSampleChapters(): Promise<SampleChapter[]> {
    return db.select().from(sampleChapters)
      .where(eq(sampleChapters.isActive, true))
      .orderBy(sampleChapters.grade, sampleChapters.subject);
  }

  async getSampleChapterById(id: string): Promise<SampleChapter | undefined> {
    const [sample] = await db.select().from(sampleChapters).where(eq(sampleChapters.id, id));
    return sample;
  }

  async getSampleChaptersBySubject(subject: string): Promise<SampleChapter[]> {
    return db.select().from(sampleChapters)
      .where(and(eq(sampleChapters.subject, subject), eq(sampleChapters.isActive, true)))
      .orderBy(sampleChapters.grade);
  }

  async getSampleChaptersByGrade(grade: number): Promise<SampleChapter[]> {
    return db.select().from(sampleChapters)
      .where(and(eq(sampleChapters.grade, grade), eq(sampleChapters.isActive, true)))
      .orderBy(sampleChapters.subject);
  }

  async seedSampleChapters(): Promise<void> {
    const existingSamples = await db.select().from(sampleChapters);
    if (existingSamples.length > 0) {
      console.log("Sample chapters already seeded");
      return;
    }

    for (const sample of sampleChapterDefinitions) {
      await db.insert(sampleChapters).values(sample);
    }
    console.log("Sample chapters seeded successfully");
  }

  async assignSampleChapterToChild(sampleChapterId: string, childId: string, parentId: string): Promise<Chapter> {
    const sample = await this.getSampleChapterById(sampleChapterId);
    if (!sample) {
      throw new Error("Sample chapter not found");
    }

    const [chapter] = await db.insert(chapters).values({
      childId,
      parentId,
      title: sample.titleAr,
      subject: sample.subject,
      grade: sample.grade,
      content: sample.content,
      status: "ready",
    }).returning();

    return chapter;
  }

  // Health Check - verify database connectivity
  async healthCheck(): Promise<void> {
    await db.execute(sql`SELECT 1`);
  }
}

export const storage = new DatabaseStorage();
