// assets
import packageJson from "package.json";

export const PlaneVersionNumber: React.FC = () => <span>Version: v{packageJson.version}</span>;
