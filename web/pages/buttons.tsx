import { Button } from "@plane/ui";

const ButtonsPage = () => (
  <div className="m-72 space-y-4">
    <Button variant="primary">Primary</Button>
    <Button variant="surface-primary">Surface Primary</Button>
    <Button variant="outline-primary">Outline Primary</Button>
    <Button variant="surface-neutral">Surface Neutral</Button>
    <Button variant="outline-neutral">Outline Neutral</Button>
    <Button variant="text-neutral">Text Neutral</Button>
    <Button variant="warning">Danger</Button>
    <Button variant="danger">Danger</Button>
  </div>
);

export default ButtonsPage;
