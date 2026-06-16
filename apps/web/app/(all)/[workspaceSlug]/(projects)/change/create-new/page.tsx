import { useState } from "react";
import { observer } from "mobx-react";
import { useParams, useRouter } from "next/navigation";
import { ChangeForm } from "@/components/change-management";
import { useChangeManagement } from "@/hooks/store/use-change-management";
import type { IChangeRequest } from "@/services/change-management.service";

const CreateNewChangePage = observer(() => {
  const { workspaceSlug } = useParams();
  const router = useRouter();
  const store = useChangeManagement();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: Partial<IChangeRequest>) => {
    if (!workspaceSlug) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
      const newChange = await store.createChange(workspaceSlug.toString(), data);
      
      // Navigate to the newly created change
      // The number contains "#" which must be encoded to prevent browser
      // interpreting it as a URL fragment/anchor
      router.push(`/${workspaceSlug}/change/${encodeURIComponent(newChange.number)}`);
    } catch (err: any) {
      console.error("Create change error:", err);
      let message = "Unknown error occurred.";
      if (typeof err === "string") {
        message = err;
      } else if (err?.error) {
        message = err.error;
      } else if (err?.detail) {
        message = err.detail;
      } else if (typeof err === "object" && err !== null) {
        // DRF serializer errors: { field_name: ["error msg", ...] }
        const fieldErrors = Object.entries(err)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(", ") : val}`)
          .join("; ");
        message = fieldErrors || JSON.stringify(err);
      }
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-custom-background-100 p-6">
      <div className="max-w-5xl mx-auto">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-md text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="flex flex-col">
          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm text-custom-text-200">
              Creating a new change request
            </span>
          </div>
          <ChangeForm 
            type="normal" 
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting}
            nextNumber={`CHG-WINJIT-#${String(
              store.changeIds.reduce((max, id) => {
                const match = id.match(/#(\d+)$/);
                if (match) {
                  const num = parseInt(match[1], 10);
                  return num > max ? num : max;
                }
                return max;
              }, 0) + 1
            ).padStart(5, "0")}`}
          />
        </div>
      </div>
    </div>
  );
});

export default CreateNewChangePage;
