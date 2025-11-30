"use client";

import LoaderUI from "@/components/LoaderUI";
import MeetingRoom from "@/components/MeetingRoom";
import MeetingSetup from "@/components/MeetingSetup";
import useGetCallById from "../../../../components/hooks/useGetCallById";
import { useUser } from "@clerk/nextjs";
import { StreamCall, StreamTheme } from "@stream-io/video-react-sdk";
import { useParams } from "next/navigation";
import { useState } from "react";

function MeetingPage() {
  const params = useParams();
  const { isLoaded } = useUser();
  const id = params?.id;
  
  // Ensure id is a string (not array or undefined)
  const callId = typeof id === "string" ? id : Array.isArray(id) ? id[0] : "";
  const { call, isCallLoading } = useGetCallById(callId);

  const [isSetupComplete, setIsSetupComplete] = useState(false);

  if (!isLoaded || isCallLoading) return <LoaderUI />;
  
  if (!callId) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-2xl font-semibold">Invalid meeting ID</p>
      </div>
    );
  }

  if (!call) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-2xl font-semibold">Meeting not found</p>
      </div>
    );
  }

  return (
    <StreamCall call={call}>
      <StreamTheme>
        {!isSetupComplete ? (
          <MeetingSetup onSetupComplete={() => setIsSetupComplete(true)} />
        ) : (
          <MeetingRoom />
        )}
      </StreamTheme>
    </StreamCall>
  );
}
export default MeetingPage;