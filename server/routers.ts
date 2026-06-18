import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getStockChart,
  getStockProfile,
  getStockInsights,
  getStockHolders,
  getMultipleQuotes,
  MAJOR_US_STOCKS,
  MARKET_INDICES,
} from "./yahooFinance";
import { getDb } from "./db";
import { watchlists, customScreens } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  stocks: router({
    chart: publicProcedure
      .input(
        z.object({
          symbol: z.string().min(1).max(10),
          interval: z.string().default("1d"),
          range: z.string().default("1y"),
        })
      )
      .query(async ({ input }) => {
        return getStockChart(input.symbol, input.interval, input.range);
      }),

    profile: publicProcedure
      .input(z.object({ symbol: z.string().min(1).max(10) }))
      .query(async ({ input }) => {
        return getStockProfile(input.symbol);
      }),

    insights: publicProcedure
      .input(z.object({ symbol: z.string().min(1).max(10) }))
      .query(async ({ input }) => {
        return getStockInsights(input.symbol);
      }),

    holders: publicProcedure
      .input(z.object({ symbol: z.string().min(1).max(10) }))
      .query(async ({ input }) => {
        return getStockHolders(input.symbol);
      }),

    quotes: publicProcedure
      .input(z.object({ symbols: z.array(z.string()).min(1).max(50) }))
      .query(async ({ input }) => {
        return getMultipleQuotes(input.symbols);
      }),

    marketIndices: publicProcedure.query(async () => {
      return getMultipleQuotes(MARKET_INDICES);
    }),

    topMovers: publicProcedure
      .input(z.object({ count: z.number().min(1).max(20).default(10) }))
      .query(async ({ input }) => {
        const subset = MAJOR_US_STOCKS.slice(0, 30);
        const quotes = await getMultipleQuotes(subset);
        const sorted = [...quotes].sort((a, b) => b.changePercent - a.changePercent);
        return {
          gainers: sorted.slice(0, input.count),
          losers: sorted.slice(-input.count).reverse(),
        };
      }),

    majorStocksList: publicProcedure.query(async () => {
      return { symbols: MAJOR_US_STOCKS };
    }),

    screen: publicProcedure
      .input(
        z.object({
          symbols: z.array(z.string()).min(1).max(100),
          sortBy: z.enum(["price", "change", "changePercent", "volume"]).default("changePercent"),
          sortOrder: z.enum(["asc", "desc"]).default("desc"),
        })
      )
      .query(async ({ input }) => {
        const quotes = await getMultipleQuotes(input.symbols);
        const sorted = [...quotes].sort((a, b) => {
          let aVal = 0, bVal = 0;
          switch (input.sortBy) {
            case "price": aVal = a.regularMarketPrice; bVal = b.regularMarketPrice; break;
            case "change": aVal = a.change; bVal = b.change; break;
            case "changePercent": aVal = a.changePercent; bVal = b.changePercent; break;
            case "volume": aVal = a.regularMarketVolume; bVal = b.regularMarketVolume; break;
          }
          return input.sortOrder === "desc" ? bVal - aVal : aVal - bVal;
        });
        return sorted;
      }),
  }),

  watchlist: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const items = await db
        .select()
        .from(watchlists)
        .where(eq(watchlists.userId, ctx.user.id));
      return items;
    }),

    add: protectedProcedure
      .input(z.object({ symbol: z.string().min(1).max(10) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.insert(watchlists).values({
          userId: ctx.user.id,
          symbol: input.symbol.toUpperCase(),
        });
        return { success: true };
      }),

    remove: protectedProcedure
      .input(z.object({ symbol: z.string().min(1).max(10) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db
          .delete(watchlists)
          .where(
            and(
              eq(watchlists.userId, ctx.user.id),
              eq(watchlists.symbol, input.symbol.toUpperCase())
            )
          );
        return { success: true };
      }),

    withQuotes: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const items = await db
        .select()
        .from(watchlists)
        .where(eq(watchlists.userId, ctx.user.id));
      if (items.length === 0) return [];
      const symbols = items.map((i) => i.symbol);
      const quotes = await getMultipleQuotes(symbols);
      return quotes;
    }),
  }),

  screens: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const items = await db
        .select()
        .from(customScreens)
        .where(eq(customScreens.userId, ctx.user.id));
      return items;
    }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(255),
          description: z.string().optional(),
          query: z.any(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.insert(customScreens).values({
          userId: ctx.user.id,
          name: input.name,
          description: input.description || null,
          query: input.query,
        });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db
          .delete(customScreens)
          .where(
            and(eq(customScreens.id, input.id), eq(customScreens.userId, ctx.user.id))
          );
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
