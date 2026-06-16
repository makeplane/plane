import type { TChangeType } from "@/services/change-management.service";

type Props = {
  selectedType: TChangeType | null;
  onSelect: (type: TChangeType) => void;
};

export const TypeSelector = ({ selectedType, onSelect }: Props) => {
  const types: { key: TChangeType; title: string; description: string; risk: string }[] = [
    {
      key: "normal",
      title: "Normal",
      description: "Standard change process with full CAB approval required. Use for high-impact or risky changes.",
      risk: "Medium - High Risk",
    },
    {
      key: "standard",
      title: "Standard",
      description: "Pre-authorized change that is low risk and has a proven history of success. No CAB approval required.",
      risk: "Low Risk",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 w-full max-w-4xl mx-auto mt-8">
      {types.map((type) => (
        <div
          key={type.key}
          onClick={() => onSelect(type.key)}
          className={`cursor-pointer rounded-lg border p-6 transition-all hover:shadow-md ${
            selectedType === type.key
              ? "border-blue-600 bg-blue-600/10 ring-1 ring-blue-600"
              : "border-subtle bg-surface-1 hover:border-blue-500"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-primary">{type.title}</h3>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              type.key === "normal" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"
            }`}>
              {type.risk}
            </span>
          </div>
          <p className="text-sm text-secondary mt-2">{type.description}</p>
        </div>
      ))}
    </div>
  );
};
