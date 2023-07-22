import Link from 'next/link';
import { type PropsWithChildren } from "react";

interface CardProps extends PropsWithChildren {
  title: string;
  link: string;
}

const Card = ({ title, link, children } : CardProps) => {
  return (
    <div className="bg-slate-50 hover:bg-slate-100 rounded-lg shadow-md p-4 cursor-pointer overflow-hidden w-56">
      <Link href={link}>
        <div className="flex flex-col justify-between space-y-4">
          <h2 className="text-xl font-semibold mb-2">{title}</h2>
          {children}
        </div>
      </Link>
    </div>
  );
};

export default Card;