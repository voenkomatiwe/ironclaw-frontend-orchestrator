import { useCallback, useEffect, useMemo, useState } from "react";
import { ChatApprovalBar } from "../components/chat-approval-bar";
import { ChatAuthCard } from "../components/chat-auth-card";
import { ChatInput } from "../components/chat-input";
import { ChatMessageList } from "../components/chat-message-list";
import { ThreadList } from "../components/thread-list";
import { useChatMessages } from "../hooks/use-chat-messages";
import { useChatState } from "../hooks/use-chat-state";
import {
  useIronclawApproval,
  useIronclawAuthCancel,
  useIronclawAuthToken,
  useIronclawCreateThread,
  useIronclawHistory,
  useIronclawSendMessage,
  useIronclawStatus,
  useIronclawThreads,
} from "../queries";
import { useIronclawChatSse } from "../use-ironclaw-chat-sse";

export function IronclawChat() {
  const { data: status } = useIronclawStatus();
  const { data: threadsData } = useIronclawThreads();
  const [activeThreadId, setActiveThreadId] = useState<string | undefined>();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isConnected = status?.connected === true;

  const allThreads = useMemo(() => {
    if (!threadsData) return [];
    const list = [];
    if (threadsData.assistant_thread) list.push(threadsData.assistant_thread);
    if (threadsData.threads) list.push(...threadsData.threads);
    return list;
  }, [threadsData]);

  useEffect(() => {
    if (!activeThreadId && threadsData?.active_thread) {
      setActiveThreadId(threadsData.active_thread);
    } else if (!activeThreadId && allThreads.length > 0) {
      setActiveThreadId(allThreads[0]!.id);
    }
  }, [threadsData, allThreads, activeThreadId]);

  const historyQuery = useIronclawHistory(activeThreadId, {
    refetchInterval: 3500,
  });
  const { data: history, refetch: refetchHistory } = historyQuery;

  const onResponse = useCallback(() => {
    void refetchHistory();
  }, [refetchHistory]);

  const chatState = useChatState(activeThreadId, onResponse);

  const chatMessages = useChatMessages(activeThreadId, history?.turns, history?.has_more, history?.oldest_timestamp);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset on thread switch
  useEffect(() => {
    chatState.resetState();
    chatMessages.resetPagination();
  }, [activeThreadId]);

  useIronclawChatSse(Boolean(isConnected && activeThreadId), chatState.handleSseEvent);

  const sendMutation = useIronclawSendMessage();
  const createThread = useIronclawCreateThread();
  const approvalMut = useIronclawApproval();
  const authTokenMut = useIronclawAuthToken();
  const authCancelMut = useIronclawAuthCancel();

  const pendingApproval = history?.pending_approval ?? chatState.sseApproval ?? undefined;

  const handleSend = useCallback(
    (text: string, images: { data: string; media_type: string }[]) => {
      sendMutation.mutate({
        content: text,
        thread_id: activeThreadId,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        images: images.length ? images : undefined,
      });
    },
    [sendMutation, activeThreadId]
  );

  const handleCreateThread = useCallback(() => {
    createThread.mutate(undefined, {
      onSuccess: (newThread) => setActiveThreadId(newThread.id),
    });
  }, [createThread]);

  return (
    <div className="flex h-full">
      <ThreadList
        activeId={activeThreadId}
        drawerOpen={drawerOpen}
        isCreating={createThread.isPending}
        onCloseDrawer={() => setDrawerOpen(false)}
        onCreate={handleCreateThread}
        onSelect={setActiveThreadId}
        threads={allThreads}
      />

      <div className="flex flex-1 flex-col">
        <ChatMessageList
          hasMore={chatMessages.hasMore}
          highlightedMessageId={chatState.highlightedMessageId}
          isConnected={isConnected}
          isLoadingOlder={chatMessages.isLoadingOlder}
          isSending={sendMutation.isPending}
          messages={chatMessages.messages}
          onLoadOlder={chatMessages.loadOlderMessages}
          onSelectPrompt={(prompt) => handleSend(prompt, [])}
          streamingText={chatState.streamingText}
          thinking={chatState.thinking}
          tools={chatState.tools}
        />

        {pendingApproval && (
          <ChatApprovalBar
            busy={approvalMut.isPending}
            onAlways={() =>
              approvalMut.mutate(
                {
                  request_id: pendingApproval.request_id,
                  action: "always",
                  thread_id: activeThreadId,
                },
                { onSuccess: () => chatState.clearApproval() }
              )
            }
            onApprove={() =>
              approvalMut.mutate(
                {
                  request_id: pendingApproval.request_id,
                  action: "approve",
                  thread_id: activeThreadId,
                },
                { onSuccess: () => chatState.clearApproval() }
              )
            }
            onDeny={() =>
              approvalMut.mutate(
                {
                  request_id: pendingApproval.request_id,
                  action: "deny",
                  thread_id: activeThreadId,
                },
                { onSuccess: () => chatState.clearApproval() }
              )
            }
            pending={pendingApproval}
          />
        )}

        {chatState.authExt && (
          <ChatAuthCard
            busy={authTokenMut.isPending || authCancelMut.isPending}
            extensionName={chatState.authExt.extension_name}
            instructions={chatState.authExt.instructions}
            onCancel={() =>
              authCancelMut.mutate(
                { extension_name: chatState.authExt!.extension_name },
                { onSuccess: () => chatState.clearAuth() }
              )
            }
            onSubmit={(tok) =>
              authTokenMut.mutate(
                {
                  extension_name: chatState.authExt!.extension_name,
                  token: tok,
                },
                { onSuccess: () => chatState.clearAuth() }
              )
            }
          />
        )}

        <ChatInput isConnected={isConnected} isSending={sendMutation.isPending} onSend={handleSend} />
      </div>
    </div>
  );
}

export default function IronclawPage() {
  return <IronclawChat />;
}
