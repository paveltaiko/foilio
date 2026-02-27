import { useState } from 'react';
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
            <p>Provozovatelem webové aplikace Foilio (dále jen „Služba") je:</p>
            <ul className="mt-2 space-y-1 pl-4 list-disc">
              <li><strong>Pavel Taiko</strong></li>
              <li>IČ: 69371776</li>
              <li>Kontaktní e-mail: <a href="mailto:pavel@ucimdesign.cz" className="text-primary-500 hover:underline">pavel@ucimdesign.cz</a></li>
            </ul>
          </>
        ),
      },
      {
        heading: '2. Jaká data sbíráme',
        content: (
          <>
            <p>Při používání Služby zpracováváme následující osobní údaje:</p>
            <ul className="mt-2 space-y-1 pl-4 list-disc">
              <li><strong>Přihlašovací údaje:</strong> jméno, e-mailová adresa a profilový obrázek z vašeho Google účtu (prostřednictvím Google Sign-In).</li>
              <li><strong>Data kolekcí:</strong> záznamy o kartách Magic: The Gathering, které si označíte jako vlastněné (set, číslo karty, foilování, množství).</li>
              <li><strong>Analytická data:</strong> anonymní údaje o používání Služby prostřednictvím Firebase Analytics a Google Analytics (navštívené stránky, typ zařízení, jazyk prohlížeče).</li>
              <li><strong>Technická data:</strong> IP adresa, typ prohlížeče a záznamy o chybách (error logs) pro účely ladění a zabezpečení.</li>
            </ul>
          </>
        ),
      },
      {
        heading: '3. Účel zpracování a právní základ',
        content: (
          <ul className="space-y-2 pl-4 list-disc">
            <li><strong>Provoz Služby</strong> – zpracování přihlašovacích údajů a dat kolekcí je nezbytné pro plnění smlouvy (čl. 6 odst. 1 písm. b) GDPR).</li>
            <li><strong>Analytika a zlepšování Služby</strong> – anonymní analytická data zpracováváme na základě oprávněného zájmu (čl. 6 odst. 1 písm. f) GDPR) za účelem zlepšování kvality a funkcionality Služby.</li>
            <li><strong>Bezpečnost a ladění</strong> – technická data a error logy zpracováváme na základě oprávněného zájmu pro zajištění bezpečnosti a stability Služby.</li>
          </ul>
        ),
      },
      {
        heading: '4. Zpracovatelé dat (třetí strany)',
        content: (
          <>
            <p>Pro provoz Služby využíváme následující zpracovatele osobních údajů:</p>
            <ul className="mt-2 space-y-2 pl-4 list-disc">
              <li>
                <strong>Google LLC / Firebase</strong> – autentizace uživatelů (Firebase Authentication), ukládání dat (Cloud Firestore) a analytika (Firebase Analytics, Google Analytics).{' '}
                <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">Firebase Privacy Policy</a>.
              </li>
              <li><strong>Scryfall LLC</strong> – veřejné API pro data o kartách Magic: The Gathering (ceny, obrázky, metadata). Scryfall neobdrží žádné vaše osobní údaje.</li>
            </ul>
            <p className="mt-2">Google LLC je certifikován v rámci EU-US Data Privacy Framework, což zajišťuje odpovídající úroveň ochrany osobních údajů při přenosu do USA.</p>
          </>
        ),
      },
      {
        heading: '5. Doba uchovávání dat',
        content: (
          <ul className="space-y-1 pl-4 list-disc">
            <li>Data vašeho účtu a kolekcí uchováváme po dobu aktivního používání Služby.</li>
            <li>Po smazání účtu jsou vaše osobní data vymazána do 30 dnů.</li>
            <li>Anonymní analytická data jsou uchovávána po dobu stanovenou Google Analytics (standardně 14 měsíců).</li>
          </ul>
        ),
      },
      {
        heading: '6. Vaše práva',
        content: (
          <>
            <p>Jako subjekt údajů máte tato práva:</p>
            <ul className="mt-2 space-y-1 pl-4 list-disc">
              <li><strong>Právo na přístup</strong> – požádat o kopii svých osobních údajů.</li>
              <li><strong>Právo na opravu</strong> – požádat o opravu nepřesných údajů.</li>
              <li><strong>Právo na výmaz</strong> – požádat o smazání svého účtu a všech přidružených dat.</li>
              <li><strong>Právo na přenositelnost</strong> – požádat o export svých dat ve strojově čitelném formátu.</li>
              <li><strong>Právo vznést námitku</strong> – vznést námitku proti zpracování na základě oprávněného zájmu.</li>
            </ul>
            <p className="mt-2">
              Svá práva můžete uplatnit e-mailem na adrese{' '}
              <a href="mailto:pavel@ucimdesign.cz" className="text-primary-500 hover:underline">pavel@ucimdesign.cz</a>.
              Na vaši žádost odpovíme do 30 dnů.
            </p>
            <p className="mt-2">
              Máte také právo podat stížnost u dozorového orgánu –{' '}
              <a href="https://www.uoou.cz" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">Úřad pro ochranu osobních údajů (ÚOOÚ)</a>.
            </p>
          </>
        ),
      },
      {
        heading: '7. Cookies a lokální úložiště',
        content: (
          <p>
            Služba využívá cookies a localStorage výhradně pro technický provoz (přihlašovací session, cache karet) a pro Firebase Analytics.
            Analytické cookies jsou nastavovány společností Google.{' '}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">Zásady ochrany soukromí Google</a>.
          </p>
        ),
      },
      {
        heading: '8. Bezpečnost dat',
        content: (
          <p>
            Veškerá data jsou šifrována při přenosu (HTTPS) i v klidu (Firebase Firestore šifrování). Přístup k datům je omezen na autentizovaného uživatele prostřednictvím Firebase Security Rules.
          </p>
        ),
      },
      {
        heading: '9. Změny zásad',
        content: (
          <p>
            Tyto zásady mohou být příležitostně aktualizovány. O podstatných změnách vás budeme informovat e-mailem nebo oznámením v aplikaci. Datum poslední aktualizace je uvedeno v záhlaví tohoto dokumentu.
          </p>
        ),
      },
      {
        heading: '10. Kontakt',
        content: (
          <p>
            S dotazy týkajícími se ochrany osobních údajů nás kontaktujte na:{' '}
            <a href="mailto:pavel@ucimdesign.cz" className="text-primary-500 hover:underline">pavel@ucimdesign.cz</a>
          </p>
        ),
      },
    ];
  }

  return [
    {
      heading: '1. Data Controller',
      content: (
        <>
          <p>The Foilio web application (hereinafter "Service") is operated by:</p>
          <ul className="mt-2 space-y-1 pl-4 list-disc">
            <li><strong>Pavel Taiko</strong></li>
            <li>Business ID (IČ): 69371776</li>
            <li>Contact email: <a href="mailto:pavel@ucimdesign.cz" className="text-primary-500 hover:underline">pavel@ucimdesign.cz</a></li>
          </ul>
        </>
      ),
    },
    {
      heading: '2. Data We Collect',
      content: (
        <>
          <p>When you use the Service, we process the following personal data:</p>
          <ul className="mt-2 space-y-1 pl-4 list-disc">
            <li><strong>Account data:</strong> your name, email address, and profile picture from your Google account (via Google Sign-In).</li>
            <li><strong>Collection data:</strong> records of Magic: The Gathering cards you mark as owned (set, collector number, foil finish, quantity).</li>
            <li><strong>Analytics data:</strong> anonymous usage data via Firebase Analytics and Google Analytics (pages visited, device type, browser language).</li>
            <li><strong>Technical data:</strong> IP address, browser type, and error logs for debugging and security purposes.</li>
          </ul>
        </>
      ),
    },
    {
      heading: '3. Purpose and Legal Basis',
      content: (
        <ul className="space-y-2 pl-4 list-disc">
          <li><strong>Operating the Service</strong> – processing account and collection data is necessary for the performance of a contract (Art. 6(1)(b) GDPR).</li>
          <li><strong>Analytics and improvement</strong> – anonymous analytics data is processed based on our legitimate interest (Art. 6(1)(f) GDPR) to improve the quality and functionality of the Service.</li>
          <li><strong>Security and debugging</strong> – technical data and error logs are processed based on legitimate interest to ensure the security and stability of the Service.</li>
        </ul>
      ),
    },
    {
      heading: '4. Data Processors (Third Parties)',
      content: (
        <>
          <p>We use the following data processors to operate the Service:</p>
          <ul className="mt-2 space-y-2 pl-4 list-disc">
            <li>
              <strong>Google LLC / Firebase</strong> – user authentication (Firebase Authentication), data storage (Cloud Firestore), and analytics (Firebase Analytics, Google Analytics).{' '}
              <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">Firebase Privacy Policy</a>.
            </li>
            <li><strong>Scryfall LLC</strong> – public API for Magic: The Gathering card data (prices, images, metadata). Scryfall does not receive any personal data about you.</li>
          </ul>
          <p className="mt-2">Google LLC is certified under the EU-US Data Privacy Framework, ensuring an adequate level of data protection for transfers to the USA.</p>
        </>
      ),
    },
    {
      heading: '5. Data Retention',
      content: (
        <ul className="space-y-1 pl-4 list-disc">
          <li>Account and collection data is retained for the duration of your active use of the Service.</li>
          <li>Upon account deletion, your personal data is erased within 30 days.</li>
          <li>Anonymous analytics data is retained for the period set by Google Analytics (typically 14 months).</li>
        </ul>
      ),
    },
    {
      heading: '6. Your Rights',
      content: (
        <>
          <p>As a data subject, you have the following rights:</p>
          <ul className="mt-2 space-y-1 pl-4 list-disc">
            <li><strong>Right of access</strong> – request a copy of your personal data.</li>
            <li><strong>Right to rectification</strong> – request correction of inaccurate data.</li>
            <li><strong>Right to erasure</strong> – request deletion of your account and all associated data.</li>
            <li><strong>Right to data portability</strong> – request an export of your data in machine-readable format.</li>
            <li><strong>Right to object</strong> – object to processing based on legitimate interest.</li>
          </ul>
          <p className="mt-2">
            To exercise your rights, contact us at{' '}
            <a href="mailto:pavel@ucimdesign.cz" className="text-primary-500 hover:underline">pavel@ucimdesign.cz</a>.
            We will respond within 30 days.
          </p>
          <p className="mt-2">
            You also have the right to lodge a complaint with a supervisory authority. In the Czech Republic, this is the{' '}
            <a href="https://www.uoou.cz" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">Office for Personal Data Protection (ÚOOÚ)</a>.
          </p>
        </>
      ),
    },
    {
      heading: '7. Cookies and Local Storage',
      content: (
        <p>
          The Service uses cookies and localStorage solely for technical operation (login session, card cache) and for Firebase Analytics.
          Analytics cookies are set by Google.{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">Google Privacy Policy</a>.
        </p>
      ),
    },
    {
      heading: '8. Data Security',
      content: (
        <p>
          All data is encrypted in transit (HTTPS) and at rest (Firebase Firestore encryption). Access to data is restricted to the authenticated user via Firebase Security Rules.
        </p>
      ),
    },
    {
      heading: '9. Changes to This Policy',
      content: (
        <p>
          This policy may be updated from time to time. We will notify you of significant changes by email or an in-app notice. The date of the last update is shown at the top of this document.
        </p>
      ),
    },
    {
      heading: '10. Contact',
      content: (
        <p>
          For any privacy-related questions, contact us at:{' '}
          <a href="mailto:pavel@ucimdesign.cz" className="text-primary-500 hover:underline">pavel@ucimdesign.cz</a>
        </p>
      ),
    },
  ];
}

export function PrivacyPolicyPage() {
  const [lang, setLang] = useState<Lang>('en');
  const sections = getSections(lang);

  const title = lang === 'cs' ? 'Zásady ochrany osobních údajů' : 'Privacy Policy';
  const updated = lang === 'cs' ? 'Naposledy aktualizováno: 27. února 2026' : 'Last updated: February 27, 2026';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-16 sm:py-12">
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
