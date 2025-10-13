"use client";

import LoaderUI from "@/components/LoaderUI";
import RecordingCard from "@/components/RecordingCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import useGetCalls from "../../../components/hooks/useGetCalls";
import { CallRecording } from "@stream-io/video-react-sdk";
import { useEffect, useState } from "react";

type RecordingItem = { recording: CallRecording; callId: string; callType: string };

function RecordingsPage() {
  const { calls, isLoading } = useGetCalls();
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);

  useEffect(() => {
    const fetchRecordings = async () => {
      if (!calls) return;

      try {
        const callData = await Promise.all(calls.map((call) => call.queryRecordings()));
        const items: RecordingItem[] = [];
        calls.forEach((call, idx) => {
          const { recordings } = callData[idx];
          recordings.forEach((r) =>
            items.push({ recording: r, callId: call.id, callType: call.type })
          );
        });

        setRecordings(items);
      } catch (error) {
        console.log("Error fetching recordings:", error);
      }
    };

    fetchRecordings();
  }, [calls]);

  if (isLoading) return <LoaderUI />;

  return (
    <div className="container max-w-7xl mx-auto p-6">
      
      <h1 className="text-3xl font-bold">Recordings</h1>
      <p className="text-muted-foreground my-1">
        {recordings.length} {recordings.length === 1 ? "recording" : "recordings"} available
      </p>


      <ScrollArea className="h-[calc(100vh-12rem)] mt-3">
        {recordings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-6">
            {recordings.map((item) => (
              <RecordingCard
                key={`${item.recording.session_id}-${item.recording.filename}`}
                recording={item.recording}
                callId={item.callId}
                callType={item.callType}
                onDeleted={(session, filename) =>
                  setRecordings((prev) =>
                    prev.filter(
                      (x) =>
                        !(x.recording.session_id === session && x.recording.filename === filename)
                    )
                  )
                }
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[400px] gap-4">
            <p className="text-xl font-medium text-muted-foreground">No recordings available</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
export default RecordingsPage;