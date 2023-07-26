import {
  createTRPCRouter,
  adminProcedure,
} from "~/server/api/trpc";

export const adminRouter = createTRPCRouter({
  getEvents: adminProcedure.query(async ({ ctx }) => {
    const res = await ctx.prisma.vastraEvent.findMany({
      include: {
        buses: {
          include: {
            passengers: true,
          }
        }
      }
    });
    return res;
  }),
});
