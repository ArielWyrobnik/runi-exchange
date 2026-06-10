import { formatDistanceToNow } from "date-fns";
import { he as heLocale } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import type { ConversationWithDetails } from "@/hooks/useMessages";
import { cn } from "@/lib/utils";

interface Props {
  conversations: ConversationWithDetails[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const ConversationList = ({ conversations, selectedId, onSelect }: Props) => {
  const { user } = useAuth();
  const { lang, t } = useLanguage();

  return (
    <div className="flex flex-col">
      {conversations.map((c) => {
        const otherName =
          c.buyer_id === user?.id
            ? c.seller?.full_name
            : c.buyer?.full_name;

        return (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={cn(
              "flex flex-col gap-0.5 border-b px-4 py-3 text-left transition-colors hover:bg-accent",
              selectedId === c.id && "bg-accent"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{otherName ?? t("unknown")}</span>
              {c.latest_message && (
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(c.latest_message.created_at), { addSuffix: true, locale: lang === "he" ? heLocale : undefined })}
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{c.listings?.title}</span>
            {c.latest_message && (
              <p className="line-clamp-1 text-sm text-muted-foreground">
                {c.latest_message.content}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ConversationList;
