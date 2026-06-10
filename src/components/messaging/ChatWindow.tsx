import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMessages, useSendMessage } from "@/hooks/useMessages";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { he as heLocale } from "date-fns/locale";
import { useLanguage } from "@/i18n/LanguageContext";

interface Props {
  conversationId: string;
}

const ChatWindow = ({ conversationId }: Props) => {
  const { user } = useAuth();
  const { data: messages, isLoading } = useMessages(conversationId);
  const sendMessage = useSendMessage();
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const { lang, t } = useLanguage();

  useEffect(() => {
    // Scroll only the message list, not the whole page
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const content = text.trim();
    setText("");
    await sendMessage.mutateAsync({ conversationId, content });
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Messages */}
      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages?.map((msg) => {
          const isOwn = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                  isOwn
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                <p>{msg.content}</p>
                <p className={cn("mt-1 text-[10px]", isOwn ? "text-primary-foreground/70" : "text-muted-foreground")}>
                  {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: lang === "he" ? heLocale : undefined })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 border-t p-3">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("typeMessage")}
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={sendMessage.isPending || !text.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

export default ChatWindow;
