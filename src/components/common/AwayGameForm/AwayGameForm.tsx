import { type inferRouterOutputs } from "@trpc/server";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useRef, useState } from "react";
import { toast } from "react-hot-toast";
import Checkbox from "~/components/atoms/Checkbox/Checkbox";
import { SelectField } from "~/components/atoms/SelectField/SelectField";
import { type AppRouter } from "~/server/api/root";
import { participantSchema } from "~/utils/zodSchemas";
import { api } from "../../../utils/api";
import { Button } from "../../atoms/Button/Button";
import { InputField } from "../../atoms/InputField/InputField";
import { OutlinedButton } from "../../atoms/OutlinedButton/OutlinedButton";


interface IPassenger {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  member: boolean;
  youth: boolean;
  consent: boolean;
  busId: string;
}

interface PassengerFormProps {
  index: number;
  passenger?: Partial<IPassenger>;
  onRemove: (index: number) => void;
  buses: inferRouterOutputs<AppRouter>['public']['getAwayGame']['buses'];
}

const PassengerForm = ({ index, passenger, onRemove, buses } : PassengerFormProps) => {
  const busOptions = buses.map((bus) => {
    const fullyBooked = bus._count.passengers >= bus.seats;
    return {
      value: bus.id,
      label: `${bus.name} - (${bus._count.passengers}/${bus.seats})` + (fullyBooked ? " - Fullbokad" : "") ,
      disabled: fullyBooked
    }
  })
  return (
    <div className="flex flex-col space-y-2 p-4 bg-gray-700 rounded-md">
      <InputField
        label="Förnamn"
        placeholder="förnamn..."
        id={`firstName_${index}`}
        name={`firstName_${index}`}
        defaultValue={passenger?.firstName || ""}
        required
      />
       <InputField
        label="Efternamn"
        placeholder="efternamn..."
        id={`lastName_${index}`}
        name={`lastName_${index}`}
        defaultValue={passenger?.lastName || ""}
        required
      />
       <InputField
        label="Mobilnummer"
        placeholder="mobil..."
        id={`phone_${index}`}
        name={`phone_${index}`}
        defaultValue={passenger?.phone || ""}
        type="tel"
        required
      />
      <InputField
        label="Email"
        placeholder="email..."
        id={`email_${index}`}
        name={`email_${index}`}
        defaultValue={passenger?.email || ""}
        required
      />
      <SelectField
        label="Buss"
        id={`busId_${index}`}
        name={`busId_${index}`}
        placeholder="Välj buss..."
        options={busOptions}
      />
      <Checkbox
        label="Jag har läst & förstått reglerna kring bussresorna"
        id={`consent_${index}`}
        name={`consent_${index}`}
        required
      />
      {index > 0 && (
        <OutlinedButton type="button" onClick={() => onRemove(index)}>Ta bort</OutlinedButton>
      )}
    </div>
  )
}

const formToParticipant = (form: Record<string, IPassenger>) => {
  return Object.values(form).map((input) => {
    return {
      ...input,
      name: `${input.firstName} ${input.lastName}`,
    }
  })
}


export const AwayGameForm = () => {
  const { query } = useRouter();
  const { id } = query;
  const session = useSession();
  const [passengers, setPassengers] = useState([{ index: 0 }]);
  const formRef = useRef<HTMLFormElement>(null);
  if (!id) return null
  if (Array.isArray(id)) return null;
  const { data: awayGame, isLoading } = api.public.getAwayGame.useQuery({ id: id });
  const { mutateAsync: submitForm } = api.payment.submitEventForm.useMutation();
  if (isLoading) return null;
  if (!awayGame) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(formData.entries());
    const formattedValues = Object.entries(values).reduce((acc, [key, value]) => {
      const [type, index] = key.split("_") as [string, string];
      if (!acc[index]) acc[index] = {};
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      acc[index][type] = value;
      return acc;
    }, {} as Record<string, any>);
    const participants = participantSchema.array().parse(formToParticipant(formattedValues));

    const res = await toast.promise(submitForm({
      eventId: id,
      participants,
    }), {
      loading: 'Skickar anmälan...',
      success: 'Anmälan skickad!',
      error: 'Något gick fel, försök igen senare.',
    });

    if (res.status === "ok") {
      setPassengers([{ index: 0 }]);
      formRef.current?.reset();
    }
  }

  return (
    <form onSubmit={handleSubmit} ref={formRef}>
      <div className="grid gap-8">
        {passengers.map(({ index }) => {
          let passenger;
          if (index === 0 && session.data) {
            passenger = {
              firstName: session.data.user?.name || "",
              lastName: "",
              phone: "",
              email: session.data.user?.email || "",
              member: false,
              youth: false,
              busId: awayGame?.buses[0]?.id || '',
            } as IPassenger
          }
          return (
            <div key={index}>
              <PassengerForm buses={awayGame.buses} index={index} passenger={passenger} onRemove={(x: number) => {
                setPassengers(passengers.filter((p) => p.index !== x));
              }} />
            </div>
          )
        })}
        <div className="flex flex-col space-y-2">
          <Button
            type="button"
            onClick={() => {
              setPassengers([...passengers, { index: passengers.length + 1 }])
            }}
            >
              Lägg till passagerare
            </Button>
          <Button type="submit">Anmäl</Button>
        </div>
      </div>
  </form>
);
}