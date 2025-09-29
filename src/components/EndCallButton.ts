"use client";

import { useCall, useCallStateHooks } from "@stream-io/video-react-sdk";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../convex/_generated/api";
import { Button } from "../components/ui/button";
import toast from "react-hot-toast";

export default function EndCallButton() {
  const call = useCall();
  const router = useRouter();
  const { useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();

  const updateInterviewStatus = useMutation(api.interviews.updateInterviewStatus);

  const interview = useQuery(api.interviews.getInterviewByStreamCallId, {
    streamCallId: call?.id || "",
  });

  const isMeetingOwner = localParticipant?.userId === call?.state?.createdBy?.id;

  const endCall = async () => {
    if (!call || !interview) return;

    try {
      await call.endCall();

      await updateInterviewStatus({
        id: interview._id,
        status: "completed",
      });

      router.push("/");
      toast.success("Meeting ended for everyone");
    } catch (error) {
      console.log(error);
      toast.error("Failed to end meeting");
    }
  };

  // Return null if not allowed or data not ready
  if (!call || !interview || !isMeetingOwner) return null;

  return 
  //   (
  //   <Button variant="destructive" onClick={endCall}>
  //     End Meeting
  //   </Button>
  // );
}
