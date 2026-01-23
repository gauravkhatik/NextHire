import {
  CallControls,
  CallingState,
  CallParticipantsList,
  PaginatedGridLayout,
  SpeakerLayout,
  useCallStateHooks,
  useCall,
} from "@stream-io/video-react-sdk";
import { LayoutListIcon, LoaderIcon, UsersIcon, PlusCircleIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./ui/resizable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import EndCallButton from "../components/EndCallButton";
import CodeCompiler from "../components/CodeCompiler";
import { useUserRole } from "./hooks/useUserRole";
import AddQuestionDialog from "../components/AddQuestionDialog";

function MeetingRoom() {
  const router = useRouter();
  const call = useCall();
  const [layout, setLayout] = useState<"grid" | "speaker">("speaker");
  const [showParticipants, setShowParticipants] = useState(false);
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const { useCallCallingState } = useCallStateHooks();
  const { isCandidate, isInterviewer, isLoading: isRoleLoading } = useUserRole();

  // Get interview by stream call ID
  const interview = useQuery(api.interviews.getInterviewByStreamCallId, {
    streamCallId: call?.id || "",
  });

  // Get questions for this interview
  const questions = useQuery(
    api.interviews.getInterviewQuestions,
    interview?._id ? { interviewId: interview._id } : "skip"
  );

  const callingState = useCallCallingState();

  if (callingState !== CallingState.JOINED || isRoleLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <LoaderIcon className="size-6 animate-spin" />
      </div>
    );
  }

  // For candidates: show video + code editor
  // For interviewers: show only video (full width)
  if (isCandidate) {
  return (
    <div className="h-[calc(100vh-4rem-1px)]">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={35} minSize={25} maxSize={100} className="relative">
          {/* VIDEO LAYOUT */}
          <div className="absolute inset-0">
            {layout === "grid" ? <PaginatedGridLayout /> : <SpeakerLayout />}

            {/* PARTICIPANTS LIST OVERLAY */}
            {showParticipants && (
              <div className="absolute right-0 top-0 h-full w-[300px] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <CallParticipantsList onClose={() => setShowParticipants(false)} />
              </div>
            )}
          </div>

          {/* VIDEO CONTROLS */}
          <div className="absolute bottom-4 left-0 right-0">
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 flex-wrap justify-center px-4">
                <CallControls onLeave={() => router.push("/")} />

                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="size-10">
                        <LayoutListIcon className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setLayout("grid")}>
                        Grid View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLayout("speaker")}>
                        Speaker View
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    variant="outline"
                    size="icon"
                    className="size-10"
                    onClick={() => setShowParticipants(!showParticipants)}
                  >
                    <UsersIcon className="size-4" />
                  </Button>

                  <EndCallButton />
                </div>
              </div>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={65} minSize={25}>
          <CodeCompiler questions={questions || []} />
        </ResizablePanel>
      </ResizablePanelGroup>
      </div>
    );
  }

  // For interviewers: show only video (full width) with Add Question button
  return (
    <div className="h-[calc(100vh-4rem-1px)] relative">
      {/* VIDEO LAYOUT */}
      <div className="absolute inset-0">
        {layout === "grid" ? <PaginatedGridLayout /> : <SpeakerLayout />}

        {/* PARTICIPANTS LIST OVERLAY */}
        {showParticipants && (
          <div className="absolute right-0 top-0 h-full w-[300px] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <CallParticipantsList onClose={() => setShowParticipants(false)} />
          </div>
        )}
      </div>

      {/* ADD QUESTION BUTTON - Top Right */}
      {isInterviewer && (
        <div className="absolute top-4 right-4 z-50">
          <Button
            onClick={() => {
              console.log("Add Question button clicked, interview:", interview?._id);
              setShowQuestionDialog(true);
            }}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <PlusCircleIcon className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </div>
      )}

      {/* VIDEO CONTROLS */}
      <div className="absolute bottom-4 left-0 right-0">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 flex-wrap justify-center px-4">
            <CallControls onLeave={() => router.push("/")} />

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="size-10">
                    <LayoutListIcon className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setLayout("grid")}>
                    Grid View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLayout("speaker")}>
                    Speaker View
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                size="icon"
                className="size-10"
                onClick={() => setShowParticipants(!showParticipants)}
              >
                <UsersIcon className="size-4" />
              </Button>

              <EndCallButton />
            </div>
          </div>
        </div>
      </div>

      {/* ADD QUESTION DIALOG */}
      {isInterviewer && (
        <AddQuestionDialog
          open={showQuestionDialog}
          onOpenChange={setShowQuestionDialog}
          interviewId={interview?._id}
        />
      )}
    </div>
  );
}
export default MeetingRoom;