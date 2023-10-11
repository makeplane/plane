import { useEffect } from "react";

// react hook form
import { useFormContext } from "react-hook-form";

// hooks
import useProjectDetails from "hooks/use-project-details";

// components
import { InlineCreateIssueFormWrapper } from "components/core";

// types
import { IIssue } from "types";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  onSuccess?: (data: IIssue) => Promise<void> | void;
  prePopulatedData?: Partial<IIssue>;
};

const InlineInput = () => {
  const { projectDetails } = useProjectDetails();

  const { register, setFocus } = useFormContext();

  useEffect(() => {
    setFocus("name");
  }, [setFocus]);

  return (
    <>
      <div className="w-[14px] h-[14px] rounded-full border border-custom-border-1000 flex-shrink-0" />
      <h4 className="text-sm text-custom-text-400">{projectDetails?.identifier ?? "..."}</h4>
      <input
        type="text"
        autoComplete="off"
        placeholder="Issue Title"
        {...register("name", {
          required: "Issue title is required.",
        })}
        className="w-full px-2 rounded-md bg-transparent text-sm font-medium leading-5 text-custom-text-200 outline-none"
      />
    </>
  );
};

export const GanttInlineCreateIssueForm: React.FC<Props> = (props) => {
  const { prePopulatedData } = props;

  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  // store
  const { issueDetail: issueDetailStore, user: userDetailStore } = useMobxStore();

  const { projectDetails } = useProjectDetails();

  const {
    reset,
    handleSubmit,
    getValues,
    setFocus,
    register,
    formState: { errors, isSubmitting },
  } = useForm<IIssue>({ defaultValues });

  // ref
  const ref = useRef<HTMLFormElement>(null);

  // states
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = () => setIsOpen(false);

  // hooks
  useKeypress("Escape", handleClose);
  useOutsideClickDetector(ref, handleClose);
  const { setToastAlert } = useToast();

  useEffect(() => {
    setFocus("name");
  }, [setFocus, isOpen]);

  useEffect(() => {
    const values = getValues();

    if (prePopulatedData) reset({ ...defaultValues, ...values, ...prePopulatedData });
  }, [reset, prePopulatedData, getValues]);

  useEffect(() => {
    if (!isOpen) reset({ ...defaultValues });
  }, [isOpen, reset]);

  useEffect(() => {
    if (!errors) return;

    Object.keys(errors).forEach((key) => {
      const error = errors[key as keyof IIssue];

      setToastAlert({
        type: "error",
        title: "Error!",
        message: error?.message?.toString() || "Some error occurred. Please try again.",
      });
    });
  }, [errors, setToastAlert]);

  const onSubmitHandler = async (formData: IIssue) => {
    if (isSubmitting || !workspaceSlug || !projectId) return;

    // resetting the form so that user can add another issue quickly
    reset({ ...defaultValues });

    try {
      await issueDetailStore.createIssue(
        workspaceSlug.toString(),
        projectId.toString(),
        formData,
        userDetailStore.currentUser! as any
      );

      setToastAlert({
        type: "success",
        title: "Success!",
        message: "Issue created successfully.",
      });
    } catch (err: any) {
      Object.keys(err || {}).forEach((key) => {
        const error = err?.[key];
        const errorTitle = error ? (Array.isArray(error) ? error.join(", ") : error) : null;

        setToastAlert({
          type: "error",
          title: "Error!",
          message: errorTitle || "Some error occurred. Please try again.",
        });
      });
    }
  };

  return (
    <>
      <form
        ref={ref}
        className="flex py-3 px-4 border-[0.5px] border-custom-border-100 mr-2.5 items-center rounded gap-x-2 bg-custom-background-100 shadow-custom-shadow-sm"
        onSubmit={handleSubmit(onSubmitHandler)}
      >
        <div className="w-[14px] h-[14px] rounded-full border border-custom-border-1000 flex-shrink-0" />
        <h4 className="text-sm text-custom-text-400">{projectDetails?.identifier ?? "..."}</h4>
        <input
          type="text"
          autoComplete="off"
          placeholder="Issue Title"
          {...register("name", {
            required: "Issue title is required.",
          })}
          className="w-full px-2 rounded-md bg-transparent text-sm font-medium leading-5 text-custom-text-200 outline-none"
        />
      </form>
      {props.isOpen && (
        <p className="text-xs ml-3 mt-3 italic text-custom-text-200">
          Press {"'"}Enter{"'"} to add another issue
        </p>
      )}
    </>
  );
};
