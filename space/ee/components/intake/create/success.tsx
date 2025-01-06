import Image from "next/image";
import { useTheme } from "next-themes";
import SuccessDark from "@/public/instance/intake-sent-dark.png";
import SuccessLight from "@/public/instance/intake-sent-light.png";

const FormSuccess = () => {
  const { resolvedTheme } = useTheme();
  return (
    <div className="flex flex-col m-auto justify-center space-y-3">
      <Image
        src={resolvedTheme?.includes("dark") ? SuccessDark : SuccessLight}
        alt="Success"
        height={205}
        width={205}
        className="mx-auto"
      />

      <span className="font-medium text-center">Issue created successfully</span>
      <span className="text-sm text-custom-text-300 max-w-[300px] text-center">
        Thank you for your feedback. Your issue has been created successfully.{" "}
      </span>
    </div>
  );
};
export default FormSuccess;
