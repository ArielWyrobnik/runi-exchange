import Layout from "@/components/layout/Layout";
import ConversationList from "@/components/messaging/ConversationList";
import ChatWindow from "@/components/messaging/ChatWindow";
import { useConversations } from "@/hooks/useMessages";
import { useState } from "react";
import { MessageSquare, Loader2 } from "lucide-react";

const Messages = () => {
  const { data: conversations, isLoading } = useConversations();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <Layout>
      <div className="container py-6">
        <h1 className="mb-4 text-2xl font-bold">Messages</h1>

        {isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !conversations || conversations.length === 0 ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
            <MessageSquare className="mb-3 h-12 w-12 text-muted-foreground" />
            <h2 className="text-lg font-semibold">No conversations yet</h2>
            <p className="text-muted-foreground">Start by contacting a seller on a listing.</p>
          </div>
        ) : (
          <div className="flex h-[70vh] overflow-hidden rounded-lg border">
            {/* Sidebar */}
            <div className={`w-full shrink-0 overflow-y-auto border-r md:w-80 ${selectedId ? "hidden md:block" : ""}`}>
              <ConversationList
                conversations={conversations}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            </div>

            {/* Chat area */}
            <div className={`flex flex-1 flex-col ${!selectedId ? "hidden md:flex" : ""}`}>
              {selectedId ? (
                <>
                  <div className="border-b p-3 md:hidden">
                    <button
                      className="text-sm font-medium text-primary"
                      onClick={() => setSelectedId(null)}
                    >
                      ← Back
                    </button>
                  </div>
                  <ChatWindow conversationId={selectedId} />
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center text-muted-foreground">
                  Select a conversation
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Messages;
