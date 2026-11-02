import { z } from "zod";
const media = z
  .string()
  .max(2000)
  .refine(
    (s) =>
      !s ||
      s.startsWith("/api/media/") ||
      s.startsWith("/images/") ||
      /^https:\/\//.test(s),
    "Usa una dirección HTTPS o sube un archivo.",
  );
const translation = z.object({
  style: z.string().max(120).optional(),
  name: z.string().max(120),
  description: z.string().max(1200),
  ingredients: z.string().max(2000),
  preparation: z.string().max(2000),
});
export const barSchema = z
  .object({
    translations: z
      .record(
        z.object({
          tagline: z.string().max(150),
          promotion: z.string().max(200),
          hours: z.string().max(200),
        }),
      )
      .optional(),
    tableCount: z.number().int().min(1).max(100).optional(),
    reviewUrl: z.string().url().optional(),
    whatsappNumber: z
      .string()
      .regex(/^\+?[1-9]\d{7,14}$/)
      .optional(),
    baseCurrency: z.enum(["USD", "MXN"]).optional(),
    sourceLanguage: z.enum(["en", "es", "fr", "zh", "ru"]).optional(),
    menuNotes: z.string().max(5000).optional(),
    website: z.string().url().optional(),
    instagram: z.string().url().optional(),
    maps: z.string().url().optional(),
    id: z.string(),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .min(3)
      .max(60)
      .refine((s) => !["demo", "admin", "api"].includes(s)),
    revision: z.number().int().positive(),
    name: z.string().trim().min(1).max(100),
    tagline: z.string().max(150),
    location: z.string().max(160),
    hours: z.string().max(200),
    promotion: z.string().max(200),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    logo: media,
    banner: media,
    bannerVideo: media,
    notes: z.string().max(3000),
    rates: z.object({
      MXN: z.number().positive().max(1000).optional(),
      USD: z.number().positive().max(1000),
      EUR: z.number().positive().max(1000),
    }),
    rateMode: z.enum(["manual", "auto"]),
    rateDate: z.string().max(100),
    demo: z.boolean(),
    categories: z
      .array(
        z.object({
          id: z
            .string()
            .regex(/^[\w-]+$/)
            .max(80),
          name: z.string().min(1).max(100),
          names: z.record(z.string().max(120)),
          icon: z.string().max(30),
        }),
      )
      .min(1)
      .max(40),
    products: z
      .array(
        z.object({
          id: z
            .string()
            .regex(/^[\w-]+$/)
            .max(80),
          family: z.string().max(40).optional(),
          options: z
            .array(
              z.object({
                label: z.string().max(150),
                price: z.number().min(0).max(100000),
              }),
            )
            .max(12)
            .optional(),
          ibuKnown: z.boolean().optional(),
          abvKnown: z.boolean().optional(),
          imagePending: z.boolean().optional(),
          isAddon: z.boolean().optional(),
          priceKnown: z.boolean().optional(),
          sourceUrl: z.string().url().optional(),
          name: z.string().min(1).max(120),
          category: z.string().max(80),
          style: z.string().max(120),
          description: z.string().max(1200),
          ingredients: z.string().max(2000),
          preparation: z.string().max(2000),
          price: z.number().min(0).max(100000),
          size: z.string().max(100),
          abv: z.number().min(0).max(100),
          ibu: z.number().min(0).max(150),
          profile: z.string().max(40),
          allergens: z.array(z.string().max(40)).max(20),
          popular: z.boolean(),
          available: z.boolean(),
          image: media,
          video: media,
          pairing: z.string().max(80),
          translations: z.record(translation),
        }),
      )
      .max(300),
  })
  .superRefine((b, ctx) => {
    const ids = b.products.map((p) => p.id),
      cats = b.categories.map((c) => c.id);
    if (new Set(ids).size !== ids.length || new Set(cats).size !== cats.length)
      ctx.addIssue({ code: "custom", message: "Identificadores repetidos." });
    for (const p of b.products)
      if (!cats.includes(p.category) || (p.pairing && !ids.includes(p.pairing)))
        ctx.addIssue({
          code: "custom",
          message: "Categoría o maridaje inválido.",
        });
  });
