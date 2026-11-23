import { Suspense } from "react";
import { NetBanner } from "@/components/discover/Network";
import TabBar from "@/components/discover/TabBar";
import ServiceWorker from "@/components/discover/ServiceWorker";
import QueueSync from "@/components/discover/QueueSync";

/** App shell for signed-in screens: offline band, content, bottom bar. The login stays outside. */
export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NetBanner />
      {children}
      <Suspense fallback={null}>
        <TabBar />
      </Suspense>
      <ServiceWorker />
      <QueueSync />
    </>
  );
}
