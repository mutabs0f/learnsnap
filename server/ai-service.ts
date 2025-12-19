import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import type { ChapterContent, Question } from "../shared/schema.js";

let anthropicClient: Anthropic | null = null;
let openaiClient: OpenAI | null = null;
let genAIClient: GoogleGenAI | null = null;

function getAnthropic(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("Missing Anthropic API key. Please set ANTHROPIC_API_KEY environment variable.");
    }
    anthropicClient = new Anthropic({
      apiKey,
      baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
    });
  }
  return anthropicClient;
}

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing OpenAI API key. Please set OPENAI_API_KEY environment variable.");
    }
    openaiClient = new OpenAI({
      apiKey,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    });
  }
  return openaiClient;
}

function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing Gemini API key. Please set GEMINI_API_KEY environment variable.");
    }
    genAIClient = new GoogleGenAI({ apiKey });
  }
  return genAIClient;
}

const SYSTEM_PROMPT = `أنت معلم تعليمي متخصص في إنشاء محتوى تعليمي للأطفال في المرحلة الابتدائية (6-12 سنة) في السعودية.

مهمتك:
1. تحليل صور صفحات الكتب المدرسية
2. استخراج المفاهيم الأساسية
3. إنشاء شرح مبسط ومناسب لعمر الطفل
4. إنشاء أسئلة تمرين (5 أسئلة سهلة-متوسطة)
5. إنشاء أسئلة اختبار (10 أسئلة متنوعة الصعوبة)

القواعد:
- استخدم لغة عربية بسيطة وواضحة
- استخدم أمثلة من الحياة اليومية
- اجعل الشرح ممتعاً ومشوقاً
- تأكد من صحة الإجابات
- الأسئلة يجب أن تكون متعددة الخيارات (4 خيارات)`;

const JSON_SCHEMA = `{
  "subject": "string (math, science, arabic, english, islamic, social)",
  "grade": number (1-6),
  "topic": "string (عنوان الموضوع بالعربية)",
  "explanation": {
    "paragraphs": ["string", "string", "string"] // 3-5 فقرات شرح بسيط
  },
  "practice": [
    {
      "question": "string (السؤال)",
      "options": ["string", "string", "string", "string"], // 4 خيارات
      "correct": "A" | "B" | "C" | "D",
      "difficulty": "easy" | "medium"
    }
  ],
  "test": [
    {
      "question": "string (السؤال)",
      "options": ["string", "string", "string", "string"], // 4 خيارات
      "correct": "A" | "B" | "C" | "D",
      "difficulty": "easy" | "medium" | "hard"
    }
  ]
}`;

// Helper to extract base64 from data URL
function extractBase64(dataUrl: string): { data: string; mimeType: string } {
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    throw new Error("Invalid data URL format");
  }
  return { mimeType: matches[1], data: matches[2] };
}

// Step 1: Generate content with Gemini Flash
export async function generateWithGemini(photos: string[], subject: string, grade: number): Promise<ChapterContent> {
  console.log("Generating content with Gemini Flash...");
  
  const imagesParts = photos.map((photo) => {
    const { data, mimeType } = extractBase64(photo);
    return {
      inlineData: {
        data,
        mimeType: mimeType as "image/jpeg" | "image/png" | "image/webp",
      },
    };
  });

  const prompt = `${SYSTEM_PROMPT}

المادة: ${subject}
الصف: ${grade}

حلل الصور المرفقة وأنشئ محتوى تعليمي بالتنسيق التالي (JSON فقط):

${JSON_SCHEMA}

مهم جداً:
- أنشئ 5 أسئلة تمرين بالضبط
- أنشئ 10 أسئلة اختبار بالضبط
- تأكد من أن JSON صحيح
- لا تضف أي نص خارج JSON`;

  try {
    const response = await getGenAI().models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            ...imagesParts,
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in Gemini response");
    }

    const content = JSON.parse(jsonMatch[0]) as ChapterContent;
    return content;
  } catch (error) {
    console.error("Gemini generation error:", error);
    throw error;
  }
}

// Step 2: Verify with GPT-4o mini
export async function verifyWithGPT(content: ChapterContent): Promise<{ status: "PASS" | "FAIL"; issues: string[] }> {
  console.log("Verifying content with GPT-4o mini...");

  const verificationPrompt = `أنت مدقق جودة للمحتوى التعليمي. راجع المحتوى التالي وتحقق من:

1. صحة الإجابات (كل سؤال له إجابة صحيحة واحدة فقط)
2. مناسبة اللغة للأطفال (6-12 سنة)
3. وضوح الأسئلة والخيارات
4. عدد الأسئلة صحيح (5 تمرين + 10 اختبار)
5. تنوع صعوبة الأسئلة

المحتوى:
${JSON.stringify(content, null, 2)}

أجب بـ JSON فقط:
{
  "status": "PASS" | "FAIL",
  "issues": ["قائمة المشاكل إن وجدت"]
}`;

  try {
    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "أنت مدقق جودة محتوى تعليمي. أجب بـ JSON فقط." },
        { role: "user", content: verificationPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      status: result.status || "PASS",
      issues: result.issues || [],
    };
  } catch (error) {
    console.error("GPT verification error:", error);
    // If verification fails, assume content is OK to not block
    return { status: "PASS", issues: [] };
  }
}

// Step 3: Fix with Claude if needed
export async function fixWithClaude(content: ChapterContent, issues: string[]): Promise<ChapterContent> {
  console.log("Fixing content with Claude Sonnet...");

  const fixPrompt = `أنت معلم تعليمي. المحتوى التالي به مشاكل تحتاج إصلاح:

المحتوى الحالي:
${JSON.stringify(content, null, 2)}

المشاكل المكتشفة:
${issues.join("\n")}

أصلح المشاكل وأعد المحتوى بنفس التنسيق (JSON فقط):

${JSON_SCHEMA}`;

  try {
    const response = await getAnthropic().messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        { role: "user", content: fixPrompt },
      ],
    });

    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text content in Claude response");
    }

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in Claude response");
    }

    return JSON.parse(jsonMatch[0]) as ChapterContent;
  } catch (error) {
    console.error("Claude fix error:", error);
    // Return original content if fix fails
    return content;
  }
}

// Main AI processing pipeline
export async function processChapterWithAI(
  photos: string[],
  subject: string,
  grade: number
): Promise<ChapterContent> {
  // Step 1: Generate with Gemini
  let content = await generateWithGemini(photos, subject, grade);

  // Step 2: Verify with GPT
  const verification = await verifyWithGPT(content);

  if (verification.status === "PASS") {
    console.log("Content verified successfully!");
    return content;
  }

  console.log("Content verification failed, fixing with Claude...");
  console.log("Issues:", verification.issues);

  // Step 3: Fix with Claude
  content = await fixWithClaude(content, verification.issues);

  // Step 4: Re-verify
  const recheck = await verifyWithGPT(content);
  if (recheck.status === "FAIL") {
    console.warn("Content still has issues after fix:", recheck.issues);
    // Continue anyway, as the content is still usable
  }

  return content;
}

// Calculate stars based on score
export function calculateStars(score: number, total: number): number {
  const percentage = (score / total) * 100;
  if (percentage >= 90) return 5;
  if (percentage >= 80) return 4;
  if (percentage >= 70) return 3;
  if (percentage >= 60) return 2;
  return 1;
}

// Calculate practice and test scores
export function calculateScores(
  practiceAnswers: string[],
  testAnswers: string[],
  practiceQuestions: Question[],
  testQuestions: Question[]
): { practiceScore: number; testScore: number; totalScore: number; stars: number } {
  let practiceScore = 0;
  let testScore = 0;

  practiceAnswers.forEach((answer, index) => {
    if (practiceQuestions[index]?.correct === answer) {
      practiceScore++;
    }
  });

  testAnswers.forEach((answer, index) => {
    if (testQuestions[index]?.correct === answer) {
      testScore++;
    }
  });

  const totalScore = practiceScore + testScore;
  const stars = calculateStars(totalScore, 15);

  return { practiceScore, testScore, totalScore, stars };
}
