import { useRef } from "react";
import { useNavigate } from "react-router";
import { useIronclawSendMessage, useIronclawStatus } from "@/ironclaw/queries";
import { ExtensionsGrid } from "../components/extensions-grid";
import { GreetingSection } from "../components/greeting-section";
import { RecentActivity } from "../components/recent-activity";
import { SuggestionsMarquee } from "../components/suggestions-marquee";
import { useSuggestions } from "../queries";

function DashboardContent() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: status } = useIronclawStatus();
  const isDisconnected = !status?.connected;
  const sendMutation = useIronclawSendMessage();
  const { topRow, bottomRow } = useSuggestions();

  const handleSend = (text: string) => {
    sendMutation.mutate(
      { content: text },
      {
        onSuccess: (data) => {
          const threadId = data?.thread_id;
          navigate(threadId ? `/ironclaw?thread=${threadId}` : "/ironclaw");
        },
      }
    );
  };

  const handleSuggestionSelect = (text: string) => {
    if (inputRef.current) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value"
      )?.set;
      nativeInputValueSetter?.call(inputRef.current, text);
      inputRef.current.dispatchEvent(new Event("input", { bubbles: true }));
      inputRef.current.focus();
    }
  };

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col px-4 py-8 md:px-6">
      <div className="flex-1 space-y-8">
        <GreetingSection
          inputRef={inputRef}
          isDisconnected={isDisconnected}
          isSending={sendMutation.isPending}
          onSend={handleSend}
        />
        <ExtensionsGrid />
        <RecentActivity />
      </div>
      <div className="mt-6 pb-2">
        <SuggestionsMarquee
          bottomRow={bottomRow}
          onSelect={handleSuggestionSelect}
          topRow={topRow}
        />
      </div>
    </div>
  );
}

export function DashboardPage() {
  return <DashboardContent />;
}

export default DashboardPage;
