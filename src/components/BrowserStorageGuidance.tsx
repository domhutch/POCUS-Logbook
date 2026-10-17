const BROWSER_GUIDES = [
  {
    label: "Chrome on computer",
    href: "https://support.google.com/chrome/answer/2392709?hl=en-GB",
  },
  {
    label: "Firefox",
    href: "https://support.mozilla.org/en-US/kb/storage",
  },
  {
    label: "Safari on Mac",
    href: "https://support.apple.com/en-euro/guide/safari/sfri11471/mac",
  },
  {
    label: "Safari on iPhone or iPad",
    href: "https://support.apple.com/en-gb/105082",
  },
  {
    label: "Chrome on Android",
    href: "https://support.google.com/chrome/answer/2392709/clear-browsing-data-computer?co=GENIE.Platform%3DAndroid&hl=en-GB",
  },
];

function BrowserStorageGuidance() {
  return (
    <section className="browser-storage-guidance" aria-labelledby="browser-storage-heading">
      <h3 id="browser-storage-heading">Keep your logbook on this device</h3>
      <p>
        This website saves cases in local browser storage, including IndexedDB. Avoid clearing cookies or other site data for this website, and avoid private browsing: doing so can delete your logbook. Keep a separate backup of important cases.
      </p>
      <p className="browser-storage-links-heading">Browser help for managing site data</p>
      <ul>
        {BROWSER_GUIDES.map(({ label, href }) => (
          <li key={label}>
            <a href={href} target="_blank" rel="noreferrer">{label}</a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default BrowserStorageGuidance;
