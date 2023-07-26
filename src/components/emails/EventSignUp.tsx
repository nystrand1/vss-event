import { Button } from '@react-email/button';
import { Tailwind, Text } from "@react-email/components";
import { Html } from '@react-email/html';
import * as React from 'react';

interface EventSignUpProps {
  name: string;
  cancellationUrl: string;
}

export const EventSignUp = ({
  name = "Filip Nystrand",
  cancellationUrl
}: EventSignUpProps) => {
  return (
    <Tailwind>
      <Html className="bg-slate-900">
        <Text className="text-white text-5xl">Hej {name}</Text>
        <Button
          pX={20}
          pY={12}
          href={cancellationUrl}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Avboka
        </Button>
      </Html>
    </Tailwind>
  );
}

export default EventSignUp;