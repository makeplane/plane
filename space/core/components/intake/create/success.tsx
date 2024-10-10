import Image from "next/image";
import Success from "@/public/instance/success.png";
const FormSuccess = () => (
  <div className="flex flex-col m-auto justify-center space-y-3">
    <Image src={Success} alt="Success" height={205} width={205} className="mx-auto" />

    <span className="font-medium text-center">Issue created successfully</span>
    <span className="text-sm text-custom-text-300 max-w-[300px] text-center">
      Thank you for your feedback. Your issue has been created successfully.{" "}
    </span>
  </div>
);
export default FormSuccess;
