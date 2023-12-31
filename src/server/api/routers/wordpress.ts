import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { GetAwayGuideBySlugDocument, GetAwayGuidesDocument, GetChronicleDocument, GetChroniclesDocument, GetNewsBySlugDocument, GetNewsDocument } from "~/types/wordpresstypes/graphql";
import { format, parseISO } from 'date-fns'
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { bandyDivisions, fotballDivisions } from "~/server/utils/awayGuideSorter";
import sv from 'date-fns/locale/sv'

const parseDateString = (dateString: string, dateFormat = "d MMMM yyyy HH:mm") => {
  const date = parseISO(dateString);
  return format(date, dateFormat, { locale: sv });
}

const stripHtmlTags = (html: string) => {
  return html.replace(/(<([^>]+)>)/gi, "");
};

export const wordpressRouter = createTRPCRouter({
  getChronicles: publicProcedure
    .query(async ({ ctx }) => {
      const res = await ctx.apolloClient.query({
        query: GetChroniclesDocument
      });

      return res.data.chronicles.nodes.map((chronicle) => ({
        ...chronicle,
        excerpt: stripHtmlTags(chronicle.chronicle.text).split(".").splice(0, 3).join(" ") + ".",
        date: parseDateString(chronicle.date),
      }));
    }),
  getChronicleBySlug: publicProcedure
    .input(z.object({ slug: z.string()}))
    .query(async ({ ctx, input }) => {
      const { data } = await ctx.apolloClient.query({
        query: GetChronicleDocument,
        variables: { slug: input.slug }
      });

      if (!data) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chronicle not found",
        });
      }
      const { chronicle } = data;

      return {
        ...chronicle,
        date: parseDateString(chronicle.date),
      };
    }),
    getAwayGuides: publicProcedure
    .query(async ({ ctx }) => {
      const res = await ctx.apolloClient.query({
        query: GetAwayGuidesDocument,
      });
      let guides = res.data.awayguides.nodes;
      let { hasNextPage, endCursor } = res.data.awayguides.pageInfo;
      while (hasNextPage) {
        const nextPage = await ctx.apolloClient.query({
          query: GetAwayGuidesDocument,
          variables: { after: endCursor }
        });
        guides = [...guides, ...nextPage.data.awayguides.nodes];
        hasNextPage = nextPage.data.awayguides.pageInfo.hasNextPage;
        endCursor = nextPage.data.awayguides.pageInfo.endCursor;
      }
      const fotballGuides = guides.filter((guide) => guide.awayGuide.sport === "Fotboll");
      const bandyGuides = guides.filter((guide) => guide.awayGuide.sport === "Bandy");

      const fotballByDivision = fotballDivisions.map((division) => {
        return {
          division,
          guides: fotballGuides.filter((guide) => guide.awayGuide.division === division)
        }
      }).filter((division) => division.guides.length > 0);

      const bandyByDivision = bandyDivisions.map((division) => {
        return {
          division,
          guides: bandyGuides.filter((guide) => guide.awayGuide.division === division)
        }
      }).filter((division) => division.guides.length > 0);

      return {
        fotball: fotballByDivision,
        bandy: bandyByDivision,
        slugs: res.data.awayguides.nodes.map((guide) => guide.slug)
      }
    }),
    getAwayGuideBySlug: publicProcedure
    .input(z.object({ slug: z.string()}))
    .query(async ({ ctx, input }) => {
      const { data } = await ctx.apolloClient.query({
        query: GetAwayGuideBySlugDocument,
        variables: { slug: input.slug }
      });

      const guide = data.awayguide

      if (!guide) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Guide not found",
        });
      }

      return {
        ...guide,
        date: parseDateString(guide.date)
      };
    }),
    getNews: publicProcedure
    .query(async ({ ctx }) => {
      const res = await ctx.apolloClient.query({
        query: GetNewsDocument,
      });

      return res.data.newsPosts.nodes.map((news) => ({
        id: news.id,
        slug: news.slug,
        title: news.newsContent.title,
        excerpt: stripHtmlTags(news.newsContent.text).split(".").splice(0, 4).join(" ") + ".",
        date: parseDateString(news.date),
        image: news.newsContent.newsImg,
        author: news.newsContent.author,
      }));
    }),
    getNewsBySlug: publicProcedure
    .input(z.object({ slug: z.string()}))
    .query(async ({ ctx, input }) => {
      const { data } = await ctx.apolloClient.query({
        query: GetNewsBySlugDocument,
        variables: { slug: input.slug }
      });

      if (!data) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "News not found",
        });
      }
      const { newsPost } = data;

      return {
        id: newsPost.id,
        slug: newsPost.slug,
        title: newsPost.newsContent.title,
        text: newsPost.newsContent.text,
        date: parseDateString(newsPost.date),
        image: newsPost.newsContent.newsImg,
        author: newsPost.newsContent.author,
      }
    }),
});

