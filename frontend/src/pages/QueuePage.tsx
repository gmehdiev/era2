import { useEffect } from "react";
import { GenerationQueue } from "@/widgets/generation-queue";

const QueuePage = () => {
  useEffect(() => {
    document.title = "ERA2 — Очередь генераций";
  }, []);

  return <GenerationQueue />;
};

export default QueuePage;
