export function FormContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-center items-center flex-grow w-full py-6 mt-10">
      <div className="relative flex flex-col gap-6 max-w-[22.5rem] w-full">{children}</div>
    </div>
  );
}
