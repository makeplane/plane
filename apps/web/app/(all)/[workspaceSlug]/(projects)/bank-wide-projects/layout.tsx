import { Archive, Globe } from "lucide-react";
import { Outlet, useNavigate, useSearchParams } from "react-router";
import { cn } from "@plane/utils";
import { Breadcrumbs, Header } from "@plane/ui";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { BankWideProjectsSearch } from "@/plane-web/components/bank-wide-projects/search";

export default function BankWideProjectsLayout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const searchQuery = searchParams.get("search") ?? "";
  const fromDate = searchParams.get("from_date") ?? "";
  const toDate = searchParams.get("to_date") ?? "";
  const showArchived = searchParams.get("show_archived") === "true";

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    void navigate(`?${params.toString()}`, { replace: true });
  };

  return (
    <>
      <AppHeader
        header={
          <Header>
            <Header.LeftItem>
              <Breadcrumbs>
                <Breadcrumbs.Item
                  component={
                    <BreadcrumbLink label="Bank-wide Projects" icon={<Globe className="h-4 w-4 text-tertiary" />} />
                  }
                />
              </Breadcrumbs>
            </Header.LeftItem>
            <Header.RightItem>
              <BankWideProjectsSearch searchQuery={searchQuery} onChange={(q) => updateParam("search", q)} />
              {/* Date range filter */}
              <div className="hidden items-center gap-2 md:flex">
                <span className="text-13 font-medium text-secondary">From</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => updateParam("from_date", e.target.value)}
                  className="rounded-md border border-subtle bg-layer-2 px-3 py-1.5 text-13 text-primary outline-none focus:border-accent-primary transition-colors"
                />
                <span className="text-13 font-medium text-secondary">To</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => updateParam("to_date", e.target.value)}
                  className="rounded-md border border-subtle bg-layer-2 px-3 py-1.5 text-13 text-primary outline-none focus:border-accent-primary transition-colors"
                />
                <button
                  onClick={() => updateParam("show_archived", showArchived ? "" : "true")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-13 font-medium transition-colors",
                    showArchived
                      ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
                      : "border-subtle bg-layer-2 text-secondary hover:text-primary"
                  )}
                >
                  <Archive className="h-3.5 w-3.5" />
                  Archived
                </button>
              </div>
            </Header.RightItem>
          </Header>
        }
      />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
