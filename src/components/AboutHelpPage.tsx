import BrowserStorageGuidance from "./BrowserStorageGuidance";

interface AboutHelpPageProps {
  onBack: () => void;
}

const QUESTIONS = [
  {
    question: "How do I record a case?",
    answer: "Choose an enabled module from Logbook type, select New case, complete the fields you want to record, then save. You can review, edit, or create a PDF report for a saved case from Cases.",
  },
  {
    question: "What do the training targets mean?",
    answer: "When Training progress is on, the overview compares your recorded cases with the pathway references shown in the app. These are personal tracking aids. They do not determine eligibility, competence, or accreditation. Turning targets off changes the overview only; it does not remove cases.",
  },
  {
    question: "What happens when I hide a module?",
    answer: "The module is removed from the pathway selector while hidden. Its cases stay on this device and become available again if you turn the module back on in Settings.",
  },
  {
    question: "Where is my logbook stored?",
    answer: "Cases are stored on this device in the app or browser storage. They do not automatically sync between devices or website addresses. Clearing browser data or removing the app may delete local cases, so keep a separate backup.",
  },
  {
    question: "Which export should I use?",
    answer: "Use Print logbook / PDF for the pathway's training-logbook summary, Download all case reports PDF for one report per saved case, or Export CSV for spreadsheet review. Individual case PDFs are available from Cases.",
  },
  {
    question: "How do backups and restore work?",
    answer: "Encrypted backups include your cases and pathway training modes. Choose a passphrase of at least 14 characters and keep it separately; the app cannot recover it. Restore merges new cases into the current logbook and does not replace existing cases. Local preferences such as text size, supervisors, and enabled modules are not included.",
  },
  {
    question: "Can I share a PDF or CSV safely?",
    answer: "PDF and CSV files are readable and are not encrypted. Review free-text fields before sharing and remove any patient-identifying details. Do not use this personal training log as a clinical record.",
  },
  {
    question: "What do Metrics tell me?",
    answer: "Metrics summarize the information recorded in your cases. They describe your logbook and do not assess scan quality, competence, or accreditation.",
  },
];

function AboutHelpPage({ onBack }: AboutHelpPageProps) {
  return (
    <section className="about-help-page" aria-labelledby="about-help-heading">
      <button className="button button-secondary" type="button" onClick={onBack}>
        Back to Settings
      </button>
      <header className="about-help-heading">
        <p className="eyebrow">CritSono: POCUS Logbook</p>
        <h2 id="about-help-heading">About &amp; Help</h2>
        <p>A quick guide to recording, reviewing, and keeping your logbook safe.</p>
      </header>

      <section className="settings-panel" aria-labelledby="getting-started-heading">
        <h3 id="getting-started-heading">Getting started</h3>
        <ol className="about-help-steps">
          <li>Choose a pathway from <strong>Logbook type</strong>.</li>
          <li>Select <strong>New case</strong> to record a scan.</li>
          <li>Open <strong>Cases</strong> to review or edit entries and create an individual PDF.</li>
          <li>Open <strong>Settings</strong> for pathway exports, backup and restore, and display preferences.</li>
        </ol>
      </section>

      <BrowserStorageGuidance />

      <section className="settings-panel" aria-labelledby="faq-heading">
        <h3 id="faq-heading">Frequently asked questions</h3>
        <div className="about-help-faqs">
          {QUESTIONS.map(({ question, answer }, index) => (
            <details key={question} open={index === 0}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="settings-panel" aria-labelledby="licenses-heading">
        <h3 id="licenses-heading">Open-source licenses</h3>
        <p>CritSono is licensed under Apache-2.0. Production dependency notices are included with this app.</p>
        <p className="about-help-note">
          <a href={`${import.meta.env.BASE_URL}PROJECT_LICENSE.txt`}>Project license</a>
          {" · "}
          <a href={`${import.meta.env.BASE_URL}THIRD_PARTY_NOTICES.txt`}>Third-party dependency notices</a>
        </p>
      </section>

      <p className="about-help-note">
        Curriculum references can change. Check the current training pack and your local training guidance when planning your training.
      </p>
    </section>
  );
}

export default AboutHelpPage;
