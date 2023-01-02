// next
import dynamic from "next/dynamic";
// components
const RemirrorRichTextEditor = dynamic(() => import("components/rich-text-editor"), { ssr: false });

const ALL_USERS = [
  { id: "joe", label: "Joe" },
  { id: "sue", label: "Sue" },
  { id: "pat", label: "Pat" },
  { id: "tom", label: "Tom" },
  { id: "jim", label: "Jim" },
];
const ALL_TAGS = [
  { id: "cel", label: "Celebrity" },
  { id: "ed", label: "Education" },
  { id: "tech", label: "Tech" },
];

export default function Home() {
  const handleJSONChange = (json: any) => {
    console.log("JSON", json);
  };

  return (
    <div className="w-full p-4">
      <h1 className="text-3xl mb-8 text-center">Remirror Components</h1>
      <RemirrorRichTextEditor
        placeholder="Enter Your Text..."
        mentions={ALL_USERS}
        tags={ALL_TAGS}
        onChange={handleJSONChange}
      />
    </div>
  );
}
