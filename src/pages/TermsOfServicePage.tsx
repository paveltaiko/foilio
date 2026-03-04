import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';
import { SegmentedControl } from '../components/ui/SegmentedControl';

type Lang = 'cs' | 'en';

interface Section {
  heading: string;
  content: React.ReactNode;
}

function getSections(lang: Lang): Section[] {
  if (lang === 'cs') {
    return [
      {
        heading: '1. Provozovatel služby',
        content: (
          <>
            <p>Webovou aplikaci Foilio (dále jen „Služba") provozuje:</p>
            <ul className="mt-2 space-y-1 pl-4 list-disc">
              <li><strong>Pavel Taiko</strong></li>
              <li>IČ: 69371776</li>
              <li>Kontakt: <a href="mailto:pavel@ucimdesign.cz" className="text-primary-500 hover:underline">pavel@ucimdesign.cz</a></li>
            </ul>
          </>
        ),
      },
      {
        heading: '2. Popis služby',
        content: (
          <p>
            Foilio je webová aplikace pro správu a sledování osobní sbírky karet Magic: The Gathering. Umožňuje uživatelům zaznamenávat vlastněné karty, sledovat hodnotu sbírky a sdílet sbírku prostřednictvím veřejného odkazu. Ceny karet jsou poskytovány třetí stranou (Scryfall) a slouží pouze jako orientační informace.
          </p>
        ),
      },
      {
        heading: '3. Podmínky používání',
        content: (
          <>
            <p>Používáním Služby souhlasíte s těmito podmínkami. Zavazujete se:</p>
            <ul className="mt-2 space-y-1 pl-4 list-disc">
              <li>používat Službu pouze pro zákonné účely a v souladu s těmito podmínkami,</li>
              <li>nezneužívat Službu k šíření škodlivého obsahu nebo k narušování jejího provozu,</li>
              <li>nesdílet přístupové údaje ke svému účtu s třetími osobami,</li>
              <li>být starší 16 let, nebo mít souhlas zákonného zástupce.</li>
            </ul>
          </>
        ),
      },
      {
        heading: '4. Uživatelský účet',
        content: (
          <>
            <p>
              Přihlášení do Služby probíhá výhradně prostřednictvím Google účtu. Odpovídáte za veškerou aktivitu provedenou pod vaším účtem.
            </p>
            <p className="mt-2">
              Vyhrazujeme si právo zrušit nebo pozastavit účet, který porušuje tyto podmínky, a to bez předchozího upozornění.
            </p>
          </>
        ),
      },
      {
        heading: '5. Obsah a data uživatele',
        content: (
          <p>
            Data zadaná do Služby (záznamy o kartách) jsou vaším vlastnictvím. Udělujete nám nevýhradní licenci k jejich uložení a zobrazení v rámci provozu Služby. Data nejsou sdílena s třetími stranami mimo poskytovatele infrastruktury (Firebase/Google).
          </p>
        ),
      },
      {
        heading: '6. Duševní vlastnictví',
        content: (
          <p>
            Veškerý kód, design a obsah Služby (s výjimkou dat zadaných uživateli) je vlastnictvím provozovatele. Magic: The Gathering, názvy karet, obrázky a loga jsou duševním vlastnictvím společnosti Wizards of the Coast LLC. Foilio není přidruženo ani schváleno společností Wizards of the Coast.
          </p>
        ),
      },
      {
        heading: '7. Dostupnost a změny služby',
        content: (
          <p>
            Služba je poskytována „tak jak je" bez záruky nepřetržité dostupnosti. Vyhrazujeme si právo kdykoli upravit, přerušit nebo ukončit provoz Služby, a to i bez předchozího upozornění. Neneseme odpovědnost za případné výpadky nebo ztrátu dat způsobenou třetími stranami (Firebase, Google).
          </p>
        ),
      },
      {
        heading: '8. Ceny karet a finanční informace',
        content: (
          <p>
            Ceny karet zobrazené ve Službě pocházejí z veřejného API Scryfall a jsou pouze orientační. Nepředstavují nabídku ke koupi ani zárukou tržní hodnoty. Provozovatel nenese odpovědnost za rozhodnutí učiněná na základě těchto cen.
          </p>
        ),
      },
      {
        heading: '9. Omezení odpovědnosti',
        content: (
          <p>
            V maximálním rozsahu povoleném platným právem provozovatel neodpovídá za žádné přímé ani nepřímé škody vzniklé v souvislosti s používáním nebo nemožností použití Služby, včetně ztráty dat nebo ztráty zisku.
          </p>
        ),
      },
      {
        heading: '10. Změny podmínek',
        content: (
          <p>
            Tyto podmínky mohou být příležitostně aktualizovány. O podstatných změnách vás budeme informovat e-mailem nebo oznámením v aplikaci. Datum poslední aktualizace je uvedeno v záhlaví tohoto dokumentu. Dalším používáním Služby po oznámení změn vyjadřujete souhlas s aktualizovanými podmínkami.
          </p>
        ),
      },
      {
        heading: '11. Rozhodné právo',
        content: (
          <p>
            Tyto podmínky se řídí právem České republiky. Případné spory budou řešeny u příslušných soudů České republiky.
          </p>
        ),
      },
      {
        heading: '12. Kontakt',
        content: (
          <p>
            S dotazy k těmto podmínkám nás kontaktujte na:{' '}
            <a href="mailto:pavel@ucimdesign.cz" className="text-primary-500 hover:underline">pavel@ucimdesign.cz</a>
          </p>
        ),
      },
    ];
  }

  return [
    {
      heading: '1. Service Provider',
      content: (
        <>
          <p>The Foilio web application (hereinafter "Service") is operated by:</p>
          <ul className="mt-2 space-y-1 pl-4 list-disc">
            <li><strong>Pavel Taiko</strong></li>
            <li>Business ID (IČ): 69371776</li>
            <li>Contact: <a href="mailto:pavel@ucimdesign.cz" className="text-primary-500 hover:underline">pavel@ucimdesign.cz</a></li>
          </ul>
        </>
      ),
    },
    {
      heading: '2. Description of Service',
      content: (
        <p>
          Foilio is a web application for managing and tracking personal Magic: The Gathering card collections. It allows users to record owned cards, track collection value, and share their collection via a public link. Card prices are provided by a third party (Scryfall) and are for informational purposes only.
        </p>
      ),
    },
    {
      heading: '3. Terms of Use',
      content: (
        <>
          <p>By using the Service, you agree to these terms. You agree to:</p>
          <ul className="mt-2 space-y-1 pl-4 list-disc">
            <li>use the Service only for lawful purposes and in accordance with these terms,</li>
            <li>not misuse the Service to distribute harmful content or disrupt its operation,</li>
            <li>not share your account credentials with third parties,</li>
            <li>be at least 16 years old, or have parental/guardian consent.</li>
          </ul>
        </>
      ),
    },
    {
      heading: '4. User Account',
      content: (
        <>
          <p>
            Login to the Service is provided exclusively through a Google account. You are responsible for all activity carried out under your account.
          </p>
          <p className="mt-2">
            We reserve the right to suspend or terminate any account that violates these terms, without prior notice.
          </p>
        </>
      ),
    },
    {
      heading: '5. User Content and Data',
      content: (
        <p>
          Data entered into the Service (card records) remains your property. You grant us a non-exclusive license to store and display it for the purpose of operating the Service. Your data is not shared with third parties outside our infrastructure providers (Firebase/Google).
        </p>
      ),
    },
    {
      heading: '6. Intellectual Property',
      content: (
        <p>
          All code, design, and content of the Service (except user-entered data) is the property of the operator. Magic: The Gathering, card names, images, and logos are intellectual property of Wizards of the Coast LLC. Foilio is not affiliated with or endorsed by Wizards of the Coast.
        </p>
      ),
    },
    {
      heading: '7. Availability and Changes',
      content: (
        <p>
          The Service is provided "as is" without any guarantee of continuous availability. We reserve the right to modify, suspend, or discontinue the Service at any time, with or without notice. We are not liable for any downtime or data loss caused by third parties (Firebase, Google).
        </p>
      ),
    },
    {
      heading: '8. Card Prices and Financial Information',
      content: (
        <p>
          Card prices displayed in the Service are sourced from the Scryfall public API and are for informational purposes only. They do not constitute an offer to buy or sell, nor a guarantee of market value. The operator is not responsible for any decisions made based on these prices.
        </p>
      ),
    },
    {
      heading: '9. Limitation of Liability',
      content: (
        <p>
          To the maximum extent permitted by applicable law, the operator shall not be liable for any direct or indirect damages arising from the use or inability to use the Service, including loss of data or loss of profit.
        </p>
      ),
    },
    {
      heading: '10. Changes to Terms',
      content: (
        <p>
          These terms may be updated from time to time. We will notify you of significant changes by email or an in-app notice. The date of the last update is shown at the top of this document. Continued use of the Service after changes are announced constitutes acceptance of the updated terms.
        </p>
      ),
    },
    {
      heading: '11. Governing Law',
      content: (
        <p>
          These terms are governed by the laws of the Czech Republic. Any disputes shall be resolved by the competent courts of the Czech Republic.
        </p>
      ),
    },
    {
      heading: '12. Contact',
      content: (
        <p>
          For any questions regarding these terms, contact us at:{' '}
          <a href="mailto:pavel@ucimdesign.cz" className="text-primary-500 hover:underline">pavel@ucimdesign.cz</a>
        </p>
      ),
    },
  ];
}

export function TermsOfServicePage() {
  const [lang, setLang] = useState<Lang>('en');
  const navigate = useNavigate();
  const sections = getSections(lang);

  const title = lang === 'cs' ? 'Podmínky použití' : 'Terms of Service';
  const updated = lang === 'cs' ? 'Naposledy aktualizováno: 27. února 2026' : 'Last updated: February 27, 2026';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-16 sm:py-12">
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Header with lang switcher */}
      <SegmentedControl
        options={[
          { id: 'en', label: 'EN' },
          { id: 'cs', label: 'CZ' },
        ]}
        value={lang}
        onChange={setLang}
        fullWidth
        className="sm:hidden w-full mb-6 text-xs"
      />
      <div className="flex items-start justify-between gap-4 mb-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">{title}</h1>
        <SegmentedControl
          options={[
            { id: 'en', label: 'EN' },
            { id: 'cs', label: 'CZ' },
          ]}
          value={lang}
          onChange={setLang}
          className="hidden sm:flex shrink-0 mt-1 text-xs"
        />
      </div>
      <p className="text-sm text-neutral-500 mb-8">{updated}</p>

      <section className="space-y-6 text-sm sm:text-base text-neutral-700 leading-relaxed">
        {sections.map((s) => (
          <div key={s.heading}>
            <h2 className="text-base sm:text-lg font-semibold text-neutral-900 mb-2">{s.heading}</h2>
            {s.content}
          </div>
        ))}
      </section>
    </div>
  );
}
