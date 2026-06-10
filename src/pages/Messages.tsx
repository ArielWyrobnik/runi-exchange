import Layout from "@/components/layout/Layout";
import ConversationList from "@/components/messaging/ConversationList";
import ChatWindow from "@/components/messaging/ChatWindow";
import { useConversations } from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { MessageSquare, Loader2, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const Messages = () => {
  const { data: conversations, isLoading } = useConversations();
  const { user } = useAuth();
  const location = useLocation();
  const [selectedId, setSelectedId] = useState<string | null>(
    (location.state as { conversationId?: string } | null)?.conversationId ?? null
  );
  const { t } = useLanguage();

  const selectedConvo = conversations?.find((c) => c.id === selectedId);
  const otherName = selectedConvo
    ? (selectedConvo.buyer_id === user?.id
        ? selectedConvo.seller?.full_name
        : selectedConvo.buyer?.full_name) ?? t("unknown")
    : null;

  return (
    <Layout>
      <div className="container py-6">
        <h1 className="mb-4 text-2xl font-bold">{t("messages")}</h1>

        {isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !conversations || conversations.length === 0 ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
            <MessageSquare className="mb-3 h-12 w-12 text-muted-foreground" />
            <h2 className="text-lg font-semibold">{t("noConversations")}</h2>
            <p className="text-muted-foreground">{t("startByContacting")}</p>
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
                  {/* Chat header — listing title first, person second (eBay style) */}
                  <div className="flex items-center gap-3 border-b p-3">
                    <button
                      className="text-primary md:hidden"
                      onClick={() => setSelectedId(null)}
                      aria-label={t("back")}
                    >
                      <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
                    </button>
                    <div className="min-w-0">
                      <p className="line-clamp-1 font-semibold leading-tight">
                        {selectedConvo?.listings?.title ?? t("unknown")}
                      </p>
                      {otherName && (
                        <p className="text-xs text-muted-foreground">{otherName}</p>
                      )}
                    </div>
                  </div>
                  <ChatWindow conversationId={selectedId} />
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center text-muted-foreground">
                  {t("selectConversation")}
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
