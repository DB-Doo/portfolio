import type { Metadata } from "next";
import Link from "next/link";

/*
Direction contract: Build a durable disclosure console inside dbdoo.dev's existing dark,
direct identity. A compact left rail establishes product, effective date, and numbered
navigation; the policy itself is one continuous, readable document rather than a pile of
cards. Cyan dot.o signals mark structure without becoming decoration. The first viewport
must answer who operates the app, what the short version is, and how to contact support.
Mobile collapses the rail into an indexed header while preserving the exact document order.
Motion is limited to native anchor scrolling, and the policy remains fully useful without
JavaScript.
*/

export const metadata: Metadata = {
  title: "dot.o Launcher Privacy Policy | dbdoo.dev",
  description:
    "Privacy policy for the Google Play edition of dot.o Launcher, including permissions, local processing, MET Norway weather, Google Play Billing, and Android backup.",
  alternates: {
    canonical: "/doto-launcher/privacy",
  },
  openGraph: {
    title: "dot.o Launcher Privacy Policy",
    description:
      "How dot.o Launcher handles local data, optional access, external services, and deletion.",
    url: "https://dbdoo.dev/doto-launcher/privacy",
    siteName: "dbdoo.dev",
    type: "website",
  },
};

export const dynamic = "force-static";

const sections = [
  ["01", "Overview", "overview"],
  ["02", "Data and features", "data-and-features"],
  ["03", "External services", "external-services"],
  ["04", "Permissions and access", "permissions"],
  ["05", "Health data", "health-data"],
  ["06", "Storage and backup", "storage-and-backup"],
  ["07", "Diagnostics you send", "diagnostics-you-send"],
  ["08", "Retention and deletion", "retention-and-deletion"],
  ["09", "Security and changes", "security-and-changes"],
] as const;

const localFeatures = [
  {
    name: "Launcher and app information",
    detail:
      "dot.o reads the launchable apps, shortcuts, icons, labels, and placement choices needed to work as your home screen. This information is processed locally.",
  },
  {
    name: "Notifications and media controls",
    detail:
      "If you enable notification access, Android may expose active notification titles, text, sender names, badges, and media details. dot.o keeps the active snapshot in memory so widgets and controls can work; it does not upload notification content.",
  },
  {
    name: "Calendar, usage, and status widgets",
    detail:
      "Optional agenda, daily screen-time, Wi-Fi, battery, and connected-device widgets read only the information required for the selected widget. Calendar events, usage history, Wi-Fi names, and accessory details are processed locally.",
  },
  {
    name: "Music visualization",
    detail:
      "Visualization reads live audio levels through Android. Audio is processed while a visualizer is active and is not recorded, saved, or uploaded.",
  },
  {
    name: "Notes and personalization",
    detail:
      "Notes, layouts, icon appearance, widget configuration, and launcher preferences are stored on your device.",
  },
] as const;

const permissions = [
  ["Notifications", "Badges, notification widgets, opening notifications, and media controls."],
  ["Calendar", "Agenda widgets that you choose to use."],
  ["Microphone / audio", "Live Android audio levels for music visualization; audio is not saved."],
  [
    "Approximate location",
    "Current-location weather after you explicitly select it, including bounded foreground refreshes while its widget is active.",
  ],
  ["Precise location", "Android requires this access to reveal the connected Wi-Fi network name."],
  ["Nearby devices", "Connected Bluetooth names, battery reports, and a transient device address used only to match and deduplicate devices."],
  ["Usage access", "On-device daily app screen-time summaries."],
  ["Health Connect", "Read-only access to steps, heart rate, and sleep for the three health widgets, and only if you add one. dot.o never writes, changes, or deletes health data."],
] as const;

function SectionHeading({
  number,
  title,
}: {
  number: string;
  title: string;
}) {
  return (
    <div className="mb-7 flex items-baseline gap-4 border-b border-neutral-800 pb-4">
      <span className="font-mono text-xs tracking-[0.2em] text-cyan-400">
        {number}
      </span>
      <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        {title}
      </h2>
    </div>
  );
}

export default function DotoLauncherPrivacyPolicy() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-200 selection:bg-cyan-300 selection:text-neutral-950">
      <a
        href="#policy"
        className="sr-only z-50 bg-white px-4 py-3 text-neutral-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to privacy policy
      </a>

      <div className="mx-auto grid min-h-screen max-w-6xl lg:grid-cols-[19rem_1fr]">
        <aside className="border-b border-neutral-800 px-6 py-8 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r lg:px-8 lg:py-10">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center font-mono text-xs tracking-[0.16em] text-neutral-400 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
          >
            ← DBDOO.DEV
          </Link>

          <div className="mt-10">
            <div aria-hidden="true" className="mb-6 grid w-fit grid-cols-4 gap-2">
              {Array.from({ length: 16 }, (_, index) => (
                <span
                  key={index}
                  className={`h-1.5 w-1.5 rounded-full ${
                    index === 5 || index === 6 || index === 9 || index === 10
                      ? "bg-cyan-300"
                      : "bg-neutral-700"
                  }`}
                />
              ))}
            </div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-400">
              dot.o Launcher
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
              Privacy policy
            </h1>
            <p className="mt-4 max-w-xs text-sm leading-6 text-neutral-400">
              Effective September 1, 2026
              <br />
              Version 1.2
            </p>
            <p className="mt-5 max-w-sm text-sm leading-6 text-neutral-300 lg:hidden">
              Local-first. No ads, no dot.o account, and no automatic
              analytics or crash reporting.
            </p>
          </div>

          <nav aria-label="Privacy policy sections" className="mt-9">
            <ol className="grid grid-cols-2 gap-1 lg:grid-cols-1">
              {sections.map(([number, label, id]) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className="group flex min-h-11 items-center gap-3 border-l border-neutral-800 px-3 text-sm text-neutral-400 transition-colors hover:border-cyan-400 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
                  >
                    <span className="font-mono text-[10px] text-neutral-600 group-hover:text-cyan-400">
                      {number}
                    </span>
                    {label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <p className="mt-8 hidden text-xs leading-5 text-neutral-500 lg:absolute lg:bottom-10 lg:left-8 lg:right-8 lg:block">
            Operated by Dan Brandt
            <br />
            <a
              href="mailto:dbdoo.dev@gmail.com"
              className="inline-flex min-h-11 items-center text-neutral-300 underline decoration-neutral-700 underline-offset-4 hover:decoration-cyan-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
            >
              dbdoo.dev@gmail.com
            </a>
          </p>
        </aside>

        <article
          id="policy"
          className="px-6 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20"
        >
          <div className="max-w-3xl">
            <section id="overview" className="scroll-mt-8">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-cyan-400">
                Plain-language policy
              </p>
              <p className="mt-5 max-w-2xl text-2xl font-medium leading-[1.35] tracking-tight text-white sm:text-4xl">
                dot.o is a local-first Android launcher. It has no ads, no
                dot.o account, and no automatic analytics or crash reporting.
                The only things that ever reach the developer are the
                diagnostic report and crash logs you choose to attach to a
                support email — and you can read both before they go.
              </p>
              <p className="mt-7 max-w-2xl text-base leading-7 text-neutral-400 sm:text-lg sm:leading-8">
                Sensitive access is optional and tied to a feature you choose.
                Most information stays on your device. The limited cases where
                information can leave the device are explained below.
              </p>
              <p className="mt-4 max-w-2xl font-mono text-xs leading-6 text-neutral-500">
                This policy covers the Google Play edition with package ID
                dev.dbdoo.launcher.
              </p>
              <div className="mt-9 border-y border-neutral-800 py-6">
                <dl className="grid gap-6 sm:grid-cols-3">
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                      Advertising
                    </dt>
                    <dd className="mt-2 text-sm text-white">None</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                      Developer analytics
                    </dt>
                    <dd className="mt-2 text-sm text-white">None</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                      Data sale
                    </dt>
                    <dd className="mt-2 text-sm text-white">Never</dd>
                  </div>
                </dl>
              </div>
            </section>

            <section id="data-and-features" className="scroll-mt-8 pt-20">
              <SectionHeading number="02" title="Data and features" />
              <div className="divide-y divide-neutral-800">
                {localFeatures.map((feature) => (
                  <div
                    key={feature.name}
                    className="grid gap-3 py-6 sm:grid-cols-[13rem_1fr] sm:gap-8"
                  >
                    <h3 className="text-sm font-medium leading-6 text-white">
                      {feature.name}
                    </h3>
                    <p className="text-sm leading-7 text-neutral-400">
                      {feature.detail}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section id="external-services" className="scroll-mt-8 pt-20">
              <SectionHeading number="03" title="External services" />
              <div className="space-y-9 text-sm leading-7 text-neutral-400">
                <div>
                  <h3 className="text-base font-medium text-white">
                    Weather and place names
                  </h3>
                  <p className="mt-2">
                    Weather sends forecast coordinates to{" "}
                    <a
                      href="https://api.met.no/doc/TermsOfService"
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-300 underline decoration-cyan-800 underline-offset-4 hover:decoration-cyan-300"
                    >
                      the Norwegian Meteorological Institute (MET Norway)
                    </a>{" "}
                    to retrieve a forecast. If precise location was already
                    enabled for another feature, Android may briefly provide a
                    more precise fix. dot.o immediately rounds a
                    current-location fix to about 0.1 degrees before caching it
                    or sending it to MET. For a custom city, Android&apos;s
                    configured geocoder receives the city name and returns
                    coordinates; dot.o also rounds those coordinates to about
                    0.1 degrees before sending them to MET. The configured
                    geocoder may also process rounded current-location
                    coordinates to produce a readable place label. MET receives
                    ordinary network metadata such as an IP address and may log the IP
                    address and coordinates under its terms. While a
                    current-location weather widget is active in the
                    foreground, dot.o may refresh approximately every 30
                    minutes; it does not run a continuous background location
                    tracker.
                  </p>
                  <p className="mt-3">
                    If the Google Weather app is unavailable, tapping a weather
                    widget can open an HTTPS Google Search URL containing the
                    readable city or place label. That search is handled by
                    Google and the selected browser under their respective
                    privacy policies.
                  </p>
                  <p className="mt-3">
                    Forecast data © the Norwegian Meteorological Institute,
                    licensed under{" "}
                    <a
                      href="https://creativecommons.org/licenses/by/4.0/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-300 underline decoration-cyan-800 underline-offset-4 hover:decoration-cyan-300"
                    >
                      CC BY 4.0
                    </a>
                    , and adapted by dot.o.
                  </p>
                </div>
                <div>
                  <h3 className="text-base font-medium text-white">
                    Google Play Billing
                  </h3>
                  <p className="mt-2">
                    Google Play processes the optional one-time dot.o Pro
                    purchase and ownership checks. dot.o receives the product
                    ID, purchase and acknowledgment status, and a purchase
                    token that it returns to Play for acknowledgment. The token
                    is never logged, saved, backed up, or sent to a dot.o
                    server. dot.o keeps only a local ownership record and
                    verification time, uses a maximum seven-day offline grace,
                    and deletes that local record when you clear app storage or
                    uninstall. Google Play Billing may send technical
                    and operational diagnostics to Google under{" "}
                    <a
                      href="https://policies.google.com/privacy"
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-300 underline decoration-cyan-800 underline-offset-4 hover:decoration-cyan-300"
                    >
                      Google&apos;s Privacy Policy
                    </a>
                    . dot.o does not receive your payment-card details.
                  </p>
                </div>
                <div>
                  <h3 className="text-base font-medium text-white">
                    Android services and backup
                  </h3>
                  <p className="mt-2">
                    Android provides permission screens, notification access,
                    app usage access, geocoding, encrypted-capable cloud backup,
                    and device transfer. Cloud backup and device transfer are
                    separate Android system paths governed by your device or
                    account provider&apos;s terms and settings.
                  </p>
                </div>
              </div>
            </section>

            <section id="permissions" className="scroll-mt-8 pt-20">
              <SectionHeading number="04" title="Permissions and access" />
              <p className="mb-7 text-sm leading-7 text-neutral-400">
                dot.o explains sensitive access before opening Android&apos;s
                permission or special-access screen. You can deny or revoke
                optional access at any time; the related feature will stop or
                use its documented fallback.
              </p>
              <dl className="divide-y divide-neutral-800 border-y border-neutral-800">
                {permissions.map(([name, purpose]) => (
                  <div
                    key={name}
                    className="grid gap-2 py-5 sm:grid-cols-[11rem_1fr] sm:gap-8"
                  >
                    <dt className="font-mono text-xs text-white">{name}</dt>
                    <dd className="text-sm leading-6 text-neutral-400">
                      {purpose}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <section id="health-data" className="scroll-mt-8 pt-20">
              <SectionHeading number="05" title="Health data" />
              <div className="space-y-5 text-sm leading-7 text-neutral-400">
                <p>
                  dot.o can show your steps, heart rate, and sleep on your home
                  screen. These three widgets are optional. If you never add one,
                  dot.o never asks for health access and never reads anything.
                </p>
                <p>
                  <span className="text-white">What it reads.</span> With your
                  permission, dot.o reads three things from Health Connect: your
                  step count, your heart rate, and your sleep. It requests read
                  access only. It cannot write, change, or delete anything in
                  Health Connect, and it does not ask for permission to.
                </p>
                <p>
                  <span className="text-white">Where it goes.</span> Nowhere.
                  Health data is read when a widget draws and kept in memory only.
                  dot.o does not store it, cache it to disk, put it in logs,
                  include it in a diagnostic report, send it over the network, or
                  share it with anyone, including us. There is no dot.o account
                  and no dot.o server for it to go to.
                </p>
                <p>
                  <span className="text-white">Turning it off.</span> You can
                  revoke dot.o&apos;s health access at any time in Health Connect,
                  or by removing the widgets. Revoking takes effect immediately
                  and the widgets simply stop showing numbers. Because nothing was
                  stored, there is nothing left behind to delete.
                </p>
                <p>
                  <span className="text-white">Advertising and analytics.</span>{" "}
                  Health data is never used for advertising, never used to profile
                  you, and never fed to analytics. dot.o has no advertising and no
                  developer-operated analytics of any kind.
                </p>
              </div>
            </section>

            <section id="storage-and-backup" className="scroll-mt-8 pt-20">
              <SectionHeading number="06" title="Storage and backup" />
              <div className="space-y-5 text-sm leading-7 text-neutral-400">
                <p>
                  Launcher layout, notes, appearance settings, widget
                  configuration, custom weather city, and the selected weather
                  location mode are stored locally. Android cloud backup may
                  transfer this selected state only through a transport that
                  reports encryption capability. Android device transfer is a
                  separate system path and may also move the same allowlisted
                  state.
                </p>
                <p>
                  Cached weather coordinates, forecast responses, active
                  notifications, Wi-Fi names, Bluetooth addresses, audio, and
                  Google Play purchase tokens are not included in dot.o&apos;s
                  backup allowlist. Backup availability and retention are
                  controlled by Android and your device or account provider.
                </p>
              </div>
            </section>

            <section id="diagnostics-you-send" className="scroll-mt-8 pt-20">
              <SectionHeading number="07" title="Diagnostics you send" />
              <div className="space-y-5 text-sm leading-7 text-neutral-400">
                <p>
                  dot.o never sends logs or diagnostics on its own. When you
                  email support, you can choose to attach a diagnostic report.
                  It is written into the email body, so you can read every line
                  before sending, and it travels only when you press send in
                  your own email app. The report describes the launcher&apos;s
                  state: app version, device model, Android version, feature
                  settings, permission and entitlement status, and the music
                  pipeline&apos;s state, including the name of the app
                  currently playing audio. It never includes song titles,
                  contacts, messages, files, location, or anything you typed.
                </p>
                <p>
                  If the launcher has crashed, it writes a crash log — a
                  technical stack trace of what failed, with the app version
                  and nothing personal — to its own private storage, keeping
                  only the newest five and never backing them up. You can also
                  choose to attach those recent crash logs to a support email
                  under the same rules, in the same readable body.
                </p>
                <p>
                  Reports arrive in the developer&apos;s support mailbox, are
                  used only to answer your email, and are kept no longer than
                  the conversation. If dot.o adds other diagnostic reports in
                  the future, they will follow these same rules: clearly
                  offered, shown to you in full, and sent only by you.
                </p>
              </div>
            </section>

            <section id="retention-and-deletion" className="scroll-mt-8 pt-20">
              <SectionHeading number="08" title="Retention and deletion" />
              <div className="space-y-5 text-sm leading-7 text-neutral-400">
                <p>
                  Local launcher state remains until you change it, clear the
                  app&apos;s storage, or uninstall dot.o. Active notification,
                  audio, Wi-Fi, and connected-device snapshots are kept only as
                  needed for the live feature. Cached weather locations and
                  forecasts may remain until they are refreshed, replaced,
                  cleared with app storage, or removed when dot.o is
                  uninstalled.
                </p>
                <p>
                  You can delete local data from{" "}
                  <span className="text-neutral-200">
                    Android App info → Storage &amp; cache → Clear storage
                  </span>
                  , or by uninstalling the app. You can manage or delete
                  Android backups through your device or account provider.
                  There is no dot.o account and no developer-held account
                  profile to request for deletion.
                </p>
              </div>
            </section>

            <section id="security-and-changes" className="scroll-mt-8 pt-20">
              <SectionHeading number="09" title="Security and changes" />
              <div className="space-y-5 text-sm leading-7 text-neutral-400">
                <p>
                  dot.o minimizes external transfer, keeps optional access
                  feature-scoped, and limits Android backup to selected
                  user-created launcher state. No software can guarantee
                  absolute security, but the app is designed to avoid operating
                  a developer data store for your private launcher content.
                </p>
                <p>
                  This policy may be updated when the app&apos;s features or
                  data practices change. The current version will remain at
                  this URL with a revised effective date.
                </p>
              </div>

              <div className="mt-12 border-t border-neutral-800 pt-8">
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-cyan-400">
                  Questions or privacy requests
                </p>
                <a
                  href="mailto:dbdoo.dev@gmail.com"
                  className="mt-4 inline-flex min-h-11 items-center text-lg font-medium text-white underline decoration-neutral-700 underline-offset-8 transition-colors hover:text-cyan-300 hover:decoration-cyan-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
                >
                  dbdoo.dev@gmail.com
                </a>
              </div>
            </section>
          </div>
        </article>
      </div>
    </main>
  );
}
