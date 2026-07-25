import { useEffect, type ReactNode } from "react";
import Layout from "@/components/layout/Layout";
import { useLanguage } from "@/i18n/LanguageContext";
import { privacyPolicy, PRIVACY_CONTACT_EMAIL } from "@/i18n/privacyPolicy";

/**
 * Renders policy text, turning any occurrence of the contact address into a
 * mailto link. The address may be wrapped in bidi isolates (Hebrew), so the
 * split tolerates the surrounding control characters.
 */
const withEmailLink = (text: string): ReactNode => {
  const parts = text.split(PRIVACY_CONTACT_EMAIL);
  if (parts.length === 1) return text;
  return parts.map((part, i) => (
    <span key={i}>
      {part}
      {i < parts.length - 1 && (
        <a
          href={`mailto:${PRIVACY_CONTACT_EMAIL}`}
          className="font-medium text-primary hover:underline"
        >
          {PRIVACY_CONTACT_EMAIL}
        </a>
      )}
    </span>
  ));
};

const Privacy = () => {
  const { lang, t } = useLanguage();
  const policy = privacyPolicy[lang];

  useEffect(() => {
    const previous = document.title;
    document.title = `${policy.title} · ${t("brand")}`;
    return () => {
      document.title = previous;
    };
  }, [policy.title, t]);

  return (
    <Layout>
      <div className="container max-w-3xl py-10">
        <h1 className="text-3xl font-bold tracking-tight">{policy.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("lastUpdated")}: {policy.lastUpdated}
        </p>

        <div className="mt-6 space-y-4">
          {policy.intro.map((paragraph, i) => (
            <p key={i} className="leading-relaxed text-muted-foreground">
              {withEmailLink(paragraph)}
            </p>
          ))}
        </div>

        <div className="mt-10 space-y-10">
          {policy.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-semibold tracking-tight">{section.heading}</h2>
              <div className="mt-3 space-y-3">
                {section.body.map((paragraph, i) => (
                  <p key={i} className="leading-relaxed text-muted-foreground">
                    {withEmailLink(paragraph)}
                  </p>
                ))}
              </div>
              {section.bullets && (
                <ul className="mt-3 space-y-2 ps-5 [&>li]:list-disc">
                  {section.bullets.map((bullet, i) => (
                    <li key={i} className="leading-relaxed text-muted-foreground">
                      {withEmailLink(bullet)}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Privacy;
