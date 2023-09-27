import { useEffect, useRef } from "react";

// next
import { useRouter } from "next/router";

// swr
import { mutate } from "swr";

// react hook form
import { useForm, FormProvider } from "react-hook-form";

// headless ui
import { Transition } from "@headlessui/react";

// services
import modulesService from "services/modules.service";
import issuesService from "services/issues.service";

// hooks
import useToast from "hooks/use-toast";
import useUser from "hooks/use-user";
import useKeypress from "hooks/use-keypress";
import useIssuesView from "hooks/use-issues-view";
import useMyIssues from "hooks/my-issues/use-my-issues";
import useGanttChartIssues from "hooks/gantt-chart/issue-view";
import useCalendarIssuesView from "hooks/use-calendar-issues-view";
import useOutsideClickDetector from "hooks/use-outside-click-detector";
import useSpreadsheetIssuesView from "hooks/use-spreadsheet-issues-view";

// helpers
import { getFetchKeysForIssueMutation } from "helpers/string.helper";

// fetch-keys
import {
  USER_ISSUE,
  SUB_ISSUES,
  CYCLE_ISSUES_WITH_PARAMS,
  MODULE_ISSUES_WITH_PARAMS,
  CYCLE_DETAILS,
  MODULE_DETAILS,
  PROJECT_ISSUES_LIST_WITH_PARAMS,
  PROJECT_DRAFT_ISSUES_LIST_WITH_PARAMS,
} from "constants/fetch-keys";

// types
import { IIssue } from "types";

const defaultValues: Partial<IIssue> = {
  name: "",
};

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  onSuccess?: (data: IIssue) => Promise<void> | void;
  prePopulatedData?: Partial<IIssue>;
  className?: string;
  children?: React.ReactNode;
};

export const addIssueToCycle = async (
  workspaceSlug: string,
  projectId: string,
  issueId: string,
  cycleId: string,
  user: any,
  params: any
) => {
  if (!workspaceSlug || !projectId) return;

  await issuesService
    .addIssueToCycle(
      workspaceSlug as string,
      projectId.toString(),
      cycleId,
      {
        issues: [issueId],
      },
      user
    )
    .then(() => {
      if (cycleId) {
        mutate(CYCLE_ISSUES_WITH_PARAMS(cycleId, params));
        mutate(CYCLE_DETAILS(cycleId as string));
      }
    });
};

export const addIssueToModule = async (
  workspaceSlug: string,
  projectId: string,
  issueId: string,
  moduleId: string,
  user: any,
  params: any
) => {
  await modulesService
    .addIssuesToModule(
      workspaceSlug as string,
      projectId.toString(),
      moduleId as string,
      {
        issues: [issueId],
      },
      user
    )
    .then(() => {
      if (moduleId) {
        mutate(MODULE_ISSUES_WITH_PARAMS(moduleId as string, params));
        mutate(MODULE_DETAILS(moduleId as string));
      }
    });
};

export const InlineCreateIssueFormWrapper: React.FC<Props> = (props) => {
  const { isOpen, handleClose, onSuccess, prePopulatedData, children, className } = props;

  const ref = useRef<HTMLFormElement>(null);

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId, viewId } = router.query;

  const isDraftIssues = router.pathname?.split("/")?.[4] === "draft-issues";

  const { user } = useUser();

  const { setToastAlert } = useToast();

  const { displayFilters, params } = useIssuesView();
  const { params: calendarParams } = useCalendarIssuesView();
  const { ...viewGanttParams } = params;
  const { params: spreadsheetParams } = useSpreadsheetIssuesView();
  const { groupedIssues, mutateMyIssues } = useMyIssues(workspaceSlug?.toString());
  const { params: ganttParams } = useGanttChartIssues(
    workspaceSlug?.toString(),
    projectId?.toString()
  );

  const method = useForm<IIssue>({ defaultValues });
  const {
    reset,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = method;

  useOutsideClickDetector(ref, handleClose);
  useKeypress("Escape", handleClose);

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

  const { calendarFetchKey, ganttFetchKey, spreadsheetFetchKey } = getFetchKeysForIssueMutation({
    cycleId: cycleId,
    moduleId: moduleId,
    viewId: viewId,
    projectId: projectId?.toString() ?? "",
    calendarParams,
    spreadsheetParams,
    viewGanttParams,
    ganttParams,
  });

  const onSubmitHandler = async (formData: IIssue) => {
    if (!workspaceSlug || !projectId || !user || isSubmitting) return;

    reset({ ...defaultValues });

    await (!isDraftIssues
      ? issuesService.createIssues(workspaceSlug.toString(), projectId.toString(), formData, user)
      : issuesService.createDraftIssue(
          workspaceSlug.toString(),
          projectId.toString(),
          formData,
          user
        )
    )
      .then(async (res) => {
        await mutate(PROJECT_ISSUES_LIST_WITH_PARAMS(projectId.toString(), params));
        if (formData.cycle && formData.cycle !== "")
          await addIssueToCycle(
            workspaceSlug.toString(),
            projectId.toString(),
            res.id,
            formData.cycle,
            user,
            params
          );
        if (formData.module && formData.module !== "")
          await addIssueToModule(
            workspaceSlug.toString(),
            projectId.toString(),
            res.id,
            formData.module,
            user,
            params
          );

        if (isDraftIssues)
          await mutate(PROJECT_DRAFT_ISSUES_LIST_WITH_PARAMS(projectId.toString() ?? "", params));
        if (displayFilters.layout === "calendar") await mutate(calendarFetchKey);
        if (displayFilters.layout === "gantt_chart") await mutate(ganttFetchKey);
        if (displayFilters.layout === "spreadsheet") await mutate(spreadsheetFetchKey);
        if (groupedIssues) await mutateMyIssues();

        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Issue created successfully.",
        });

        if (onSuccess) await onSuccess(res);

        if (formData.assignees_list?.some((assignee) => assignee === user?.id))
          mutate(USER_ISSUE(workspaceSlug as string));

        if (formData.parent && formData.parent !== "") mutate(SUB_ISSUES(formData.parent));
      })
      .catch((err) => {
        Object.keys(err || {}).forEach((key) => {
          const error = err?.[key];
          const errorTitle = error ? (Array.isArray(error) ? error.join(", ") : error) : null;

          setToastAlert({
            type: "error",
            title: "Error!",
            message: errorTitle || "Some error occurred. Please try again.",
          });
        });
      });
  };

  return (
    <>
      <Transition
        show={isOpen}
        enter="transition ease-in-out duration-200 transform"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in-out duration-200 transform"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <FormProvider {...method}>
          <form ref={ref} className={className} onSubmit={handleSubmit(onSubmitHandler)}>
            {children}
          </form>
        </FormProvider>
      </Transition>
    </>
  );
};
