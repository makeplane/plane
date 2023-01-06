type Props = {
  setStep: React.Dispatch<React.SetStateAction<number>>;
};

const InviteMembers: React.FC<Props> = ({ setStep }) => {
  return (
    <form className="grid w-full place-items-center space-y-8">
      <div className="w-full space-y-4 rounded-lg bg-white p-8 md:w-2/5">
        <h2 className="text-2xl font-medium">User Details</h2>
      </div>
      <div className="mx-auto h-1/4 space-y-2 lg:w-1/4">
        <button type="submit" className="w-full rounded-md bg-gray-200 px-4 py-2 text-sm">
          Invite members
        </button>
        <button
          type="submit"
          className="w-full rounded-md bg-gray-200 px-4 py-2 text-sm"
          onClick={() => setStep(4)}
        >
          Skip
        </button>
      </div>
    </form>
  );
};

export default InviteMembers;
