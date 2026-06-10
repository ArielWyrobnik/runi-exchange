import Layout from "@/components/layout/Layout";
import ConversationList from "@/components/messaging/ConversationList";
import ChatWindow from "@/components/messaging/ChatWindow";
import { useConversations } from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";
import { Link, useSearchParams } from "react-router-dom";
import { MessageSquare, Loader2, ArrowLeft, Package } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const Messages = () => {
  const { data: conversations, isLoading } = useConversations();
  const { user } = useAuth();
  const { t } = useLanguage();
  // Selection lives in the URL (?c=<id>) so it survives reloads and
  // deep links from "Contact Seller"
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("c");
  const selectConversation = (id: string | null) =>
    setSearchParams(id ? { c: id } : {});

  const selectedConvo = conversations?.find((c) => c.id === selectedId);
  const otherName = selectedConvo
    ? (selectedConvo.buyer_id === user?.id
        ? selectedConvo.seller?.full_name
        : selectedConvo.buyer?.full_name) ?? t("unknown")
    : null;
  const listingImage = selectedConvo?.listings?.listing_images
    ?.slice()
    .sort((a, b) => a.display_order - b.display_order)[0]?.image_url;

  return (
    <Layout fullHeight>
      <div className="container flex h-full min-h-0 flex-col py-4">
        <h1 className="mb-3 text-2xl font-bold">{t("messages")}</h1>

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
          <div className="flex min-h-0 flex-1 overflow-hidden rounded-lg border">
            {/* Sidebar — scrolls on its own when there are many chats */}
            <div className={`min-h-0 w-full shrink-0 overflow-y-auto border-r md:w-80 ${selectedId ? "hidden md:block" : ""}`}>
              <ConversationList
                conversations={conversations}
                selectedId={selectedId}
                onSelect={selectConversation}
              />
            </div>

            {/* Chat area */}
            <div className={`flex min-h-0 flex-1 flex-col ${!selectedId ? "hidden md:flex" : ""}`}>
              {selectedId ? (
                <>
                  {/* Chat header — listing photo, title + price, person below (eBay style) */}
                  <div className="flex items-center gap-3 border-b p-3">
                    <button
                      className="text-primary md:hidden"
                      onClick={() => selectConversation(null)}
                      aria-label={t("back")}
                    >
                      <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
                    </button>
                    {selectedConvo && (
                      <Link
                        to={`/listing/${selectedConvo.listing_id}`}
                        className="flex min-w-0 flex-1 items-center gap-3"
                      >
                        {listingImage ? (
                          <img
                            src={listingImage}
                            alt={selectedConvo.listings?.title ?? ""}
                            className="h-11 w-11 shrink-0 rounded-md border object-cover"
                          />
                        ) : (
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground">
                            <Package className="h-5 w-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="line-clamp-1 font-semibold leading-tight">
                            {selectedConvo.listings?.title ?? t("unknown")}
                          </p>
                          <p className="text-xs text-muted-foreground">{otherName}</p>
                        </div>
                        {selectedConvo.listings && (
                          <span className="ms-auto shrink-0 font-bold text-primary">
                            ₪{selectedConvo.listings.price}
                          </span>
                        )}
                      </Link>
                    )}
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
