import type { TBaseLayoutType } from "@plane/types";
import { KanbanLayoutLoader } from "@/components/ui/loader/layouts/kanban-layout-loader";
import { ListLayoutLoader } from "@/components/ui/loader/layouts/list-layout-loader";

interface GenericLayoutLoaderProps {
  layout: TBaseLayoutType;
  /** Optional custom loaders to override defaults */
  customLoaders?: Partial<Record<TBaseLayoutType, React.ComponentType>>;
}

export function GenericLayoutLoader({ layout, customLoaders }: GenericLayoutLoaderProps) {
  const CustomLoader = customLoaders?.[layout];
  if (CustomLoader) return <CustomLoader />;

  switch (layout) {
    case "list":
      return <ListLayoutLoader />;
    case "kanban":
      return <KanbanLayoutLoader />;
    default:
      console.warn(`Unknown layout: ${layout}`);
      return null;
  }
}
