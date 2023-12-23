import { format, isAfter } from "date-fns";
import Head from "next/head";
import Card from "~/atoms/CardLink/CardLink";
import { Progressbar } from "~/atoms/Progressbar/Progressbar";
import { Button } from "~/components/atoms/Button/Button";
import { api } from "~/utils/api";
import { PATHS } from "~/utils/constants";
import { createSSRHelper } from "~/utils/createSSRHelper";

export default function Home() {
  const { data: awayGames, isLoading: isLoadingAwayGames } = api.public.getAwayGames.useQuery();

  return (
    <>
      <Head>
        <title>Västra Sidan</title>
      </Head>
        <div className="flex flex-col items-center justify-center gap-12">
          <h1 className="text-[2.3rem] md:text-[4rem] lg:text-[5rem] font-extrabold text-white">
            Bussresor
          </h1>
          <div className="grid grid-cols-12 gap-4 md:gap-8 text-black w-full">
            {isLoadingAwayGames && <p className="text-white col-span-12 text-center">Laddar resor...</p>}
            {awayGames?.map((game, index) => {
              let centerClass = "";
              const gameExpired = isAfter(new Date(), game.date);
              if (index === 0) {
                centerClass = awayGames.length === 1 ? "md:col-start-4 xl:col-start-5" 
                  : awayGames.length === 2 ? "md:col-start-1 xl:col-start-3"
                  : "";
              }
              return (
                <div key={game.id} className={`col-span-12 md:col-span-6 xl:col-span-4 w-full ${centerClass}`}>
                <Card
                  title={game.name}
                  link={`${PATHS.awayGames}${game.id}`}
                >
                  <div className="space-y-1">
                    <p className="text-md font-semibold">Bussen avgår {format(game.date, "HH:mm")}</p>
                    <p className="text-sm">Pris vuxen medlem: {game.memberPrice} kr</p>
                    <p className="text-sm">Pris vuxen icke medlem: {game.defaultPrice} kr</p>
                    <p className="text-sm">Pris ungdom medlem: {game.youthMemberPrice} kr</p>
                    <p className="text-sm">Pris ungdom icke medlem: {game.youthPrice} kr</p>
                  </div>
                  <Progressbar
                    label="Antal anmälda"
                    maxValue={game.maxSeats}
                    currentValue={game.bookedSeats}
                  />
                  {game.bookedSeats < game.maxSeats && (
                    <Button>Till anmälan</Button>
                  )}
                  {game.bookedSeats >= game.maxSeats && !gameExpired && (
                    <Button disabled>Fullbokat</Button>
                  )}
                  {gameExpired && (
                    <Button disabled>Resan har redan varit</Button>
                  )}
                </Card>
              </div>
              )
            })}
            {!isLoadingAwayGames && awayGames?.length === 0 && <p className="text-white text-center col-span-12">Inga planerade resor just nu</p>}
            </div>
        </div>
    </>
  );
}


export async function getServerSideProps() {
  const ssrHelper = await createSSRHelper();

  await ssrHelper.public.getAwayGames.prefetch();

  return {
    props: {
      trpcState: ssrHelper.dehydrate()
    },
    revalidate: 60
  }
}
