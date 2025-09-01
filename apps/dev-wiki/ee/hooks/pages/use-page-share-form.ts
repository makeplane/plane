import { useEffect, useCallback, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { EPageSharedUserAccess } from "@plane/types";
import { TWorkspacePage } from "@/plane-web/store/pages/workspace-page";

export type TPageShareFormUser = {
  id: string; // Unique identifier for the form
  user_id: string;
  access: EPageSharedUserAccess;
  isNew?: boolean; // Flag to identify new users
  originalAccess?: EPageSharedUserAccess; // Original access for existing users
  isOwner?: boolean; // Flag to identify the page owner
};

export type TPageShareFormData = {
  sharedUsers: TPageShareFormUser[];
};

export type TPageShareFormActions = {
  addUser: (user: { user_id: string }) => void;
  removeUser: (userId: string) => void;
  updateUserAccess: (userId: string, access: EPageSharedUserAccess) => void;
  reset: () => void;
  optimisticSave: () => TPageShareFormUser[]; // Returns original state for rollback
  rollback: (originalState: TPageShareFormUser[]) => void;
  getNewUsers: () => TPageShareFormUser[];
  getModifiedUsers: () => TPageShareFormUser[];
  getRemovedUsers: () => TPageShareFormUser[];
};

export type TPageShareFormReturn = {
  formState: {
    isDirty: boolean;
    isSubmitting: boolean;
  };
  data: TPageShareFormData;
  actions: TPageShareFormActions;
  handleSubmit: (
    onSubmit: (data: TPageShareFormData) => Promise<void>
  ) => (e?: React.BaseSyntheticEvent) => Promise<void>;
};

export const usePageShareForm = (page: TWorkspacePage | null | undefined): TPageShareFormReturn => {
  // Transform mobx shared users to form users with safety checks
  const getFormUsersFromMobx = useCallback(() => {
    if (!page?.sharedUsers) return [];

    return page.sharedUsers
      .filter((user, index, arr) => arr.findIndex((u) => u.user_id === user.user_id) === index)
      .map((user) => ({
        id: `existing-${user.user_id}`,
        user_id: user.user_id,
        access: user.access,
        isNew: false,
        originalAccess: user.access,
      }));
  }, [page?.sharedUsers]);

  // React Hook Form setup
  const form = useForm<TPageShareFormData>({
    defaultValues: {
      sharedUsers: getFormUsersFromMobx(),
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "sharedUsers",
  });

  // Sync form with mobx when mobx data changes (bidirectional flow)
  useEffect(() => {
    if (!page?.sharedUsers) return;

    const mobxFormUsers = getFormUsersFromMobx();
    const currentFormUsers = form.getValues("sharedUsers") || [];

    // Only reset if there's actually a difference to avoid infinite loops
    const hasChanges =
      mobxFormUsers.length !== currentFormUsers.filter((user) => !user.isNew).length ||
      mobxFormUsers.some((mobxUser) => {
        const formUser = currentFormUsers.find((fu) => fu.user_id === mobxUser.user_id && !fu.isNew);
        return !formUser || formUser.originalAccess !== mobxUser.access;
      });

    if (hasChanges) {
      // Preserve new users (pending) and only update existing users from mobx
      const newUsers = currentFormUsers.filter((user) => user.isNew);
      const updatedUsers = [...mobxFormUsers, ...newUsers];
      form.reset({ sharedUsers: updatedUsers });
    }
  }, [page?.sharedUsers, form, getFormUsersFromMobx]);

  // Helper functions with safety checks
  const getCurrentUsers = useCallback(() => {
    const users = form.getValues("sharedUsers");
    return users || [];
  }, [form]);

  const getNewUsers = useCallback(() => {
    const users = getCurrentUsers();
    return users.filter((user) => user.isNew) || [];
  }, [getCurrentUsers]);

  const getModifiedUsers = useCallback(() => {
    const users = getCurrentUsers();
    return (
      users.filter((user) => {
        if (user.isNew) return false;
        return user.originalAccess !== user.access;
      }) || []
    );
  }, [getCurrentUsers]);

  const getRemovedUsers = useCallback(() => {
    const currentUsers = getCurrentUsers();
    const currentUserIds = new Set(currentUsers.map((u) => u.user_id));
    const mobxUsers = getFormUsersFromMobx();
    return mobxUsers.filter((user) => !currentUserIds.has(user.user_id));
  }, [getCurrentUsers, getFormUsersFromMobx]);

  // Actions with safety checks
  const actions = useMemo(
    () => ({
      addUser: (user: { user_id: string }) => {
        if (!user?.user_id) return;

        // Check for duplicates
        const currentUsers = getCurrentUsers();
        const exists = currentUsers.some((u) => u.user_id === user.user_id);
        if (exists) return;

        const newUser: TPageShareFormUser = {
          id: `new-${Date.now()}-${user.user_id}`,
          user_id: user.user_id,
          access: EPageSharedUserAccess.VIEW,
          isNew: true,
        };

        append(newUser);
      },

      removeUser: (userId: string) => {
        if (!userId) return;

        const currentUsers = getCurrentUsers();
        const userIndex = currentUsers.findIndex((u) => u.user_id === userId);
        if (userIndex !== -1) {
          remove(userIndex);
        }
      },

      updateUserAccess: (userId: string, access: EPageSharedUserAccess) => {
        if (!userId || access === undefined || access === null) return;

        const currentUsers = getCurrentUsers();
        const userIndex = currentUsers.findIndex((u) => u.user_id === userId);
        if (userIndex !== -1) {
          const user = currentUsers[userIndex];
          update(userIndex, { ...user, access });
        }
      },

      reset: () => {
        form.reset({ sharedUsers: getFormUsersFromMobx() });
      },

      optimisticSave: () => {
        const currentUsers = getCurrentUsers();
        const pendingUsers = currentUsers.filter((user) => user.isNew);

        if (pendingUsers.length === 0) {
          return currentUsers; // Return current state for rollback
        }

        // Convert pending users to existing users
        const optimisticUsers = currentUsers.map((user) => {
          if (user.isNew) {
            return {
              ...user,
              id: `existing-${user.user_id}`,
              isNew: false,
              originalAccess: user.access,
            };
          }
          return user;
        });

        // Update form with optimistic state
        form.setValue("sharedUsers", optimisticUsers);

        return currentUsers; // Return original state for potential rollback
      },

      rollback: (originalState: TPageShareFormUser[]) => {
        form.setValue("sharedUsers", originalState);
      },

      getNewUsers,
      getModifiedUsers,
      getRemovedUsers,
    }),
    [
      append,
      remove,
      update,
      getCurrentUsers,
      getNewUsers,
      getModifiedUsers,
      getRemovedUsers,
      form,
      getFormUsersFromMobx,
    ]
  );

  // Submit handler with safety checks
  const handleSubmit = useCallback(
    (onSubmit: (data: TPageShareFormData) => Promise<void>) => {
      if (!onSubmit) return () => Promise.resolve();
      return form.handleSubmit(onSubmit);
    },
    [form]
  );

  // Safe field casting
  const safeFields = useMemo(() => (fields as TPageShareFormUser[]) || [], [fields]);

  return {
    formState: {
      isDirty: form.formState?.isDirty || false,
      isSubmitting: form.formState?.isSubmitting || false,
    },
    data: {
      sharedUsers: safeFields,
    },
    actions,
    handleSubmit,
  };
};
