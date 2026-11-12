import { IntroView } from "../components/intro-view";
export default function Home() {
  const now = new Date();
  const dates = Array.from(
    { length: 5 },
    (_, index) =>
      `${now.getFullYear() + index}.${String(now.getMonth() + 1).padStart(2, "0")}`,
  );
  return <IntroView dates={dates} />;
}
