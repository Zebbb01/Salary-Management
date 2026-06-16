import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Salary Dashboard",
  description:
    "Privacy Policy for Salary Dashboard, a personal finance tool for Filipino professionals.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      {/* Disclaimer */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-5 py-4">
        <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
          Disclaimer
        </p>
        <p className="mt-1 text-xs leading-relaxed text-amber-600/80 dark:text-amber-400/80">
          This is a placeholder Privacy Policy document and does not constitute
          actual legal advice. Consult a qualified attorney for a legally
          compliant privacy policy appropriate to your jurisdiction.
        </p>
      </div>

      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: June 2026
        </p>
      </header>

      {/* Introduction */}
      <section className="space-y-3 border-b border-border/50 pb-8">
        <h2 className="text-2xl font-semibold text-foreground">
          1. Introduction
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Salary Dashboard (&quot;the App,&quot; &quot;we,&quot; &quot;us,&quot;
          or &quot;our&quot;) is committed to protecting your privacy. This
          Privacy Policy explains how we collect, use, store, and protect your
          personal and financial information when you use our personal finance
          tracking application.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          This policy applies to all users of Salary Dashboard. By using the
          App, you agree to the collection and use of information in accordance
          with this Privacy Policy.
        </p>
      </section>

      {/* Information We Collect */}
      <section className="space-y-5 border-b border-border/50 pb-8">
        <h2 className="text-2xl font-semibold text-foreground">
          2. Information We Collect
        </h2>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">
            2.1 Account Data
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            When you create an account, we collect the following information:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed text-muted-foreground">
            <li>Email address</li>
            <li>Full name (if provided)</li>
            <li>
              Authentication credentials (managed securely through Supabase
              Auth)
            </li>
            <li>Account preferences and settings</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">
            2.2 Financial Data
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            To provide our budgeting and expense tracking features, we collect
            financial information that you voluntarily enter into the App,
            including:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed text-muted-foreground">
            <li>Salary and income details</li>
            <li>Budget allocation categories and amounts</li>
            <li>Bill names, amounts, due dates, and payment statuses</li>
            <li>Expense records, categories, and amounts</li>
            <li>Custom budget categories and labels</li>
          </ul>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We do not collect bank account numbers, credit card numbers, or any
            direct financial account credentials. All financial data is
            self-reported by you.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">
            2.3 Usage Data
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We may automatically collect certain information about how you
            interact with the App, including:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed text-muted-foreground">
            <li>Pages viewed and features used</li>
            <li>Browser type and version</li>
            <li>Device type and operating system</li>
            <li>Session duration and frequency of use</li>
            <li>Error logs and performance data</li>
          </ul>
        </div>
      </section>

      {/* How We Use Your Information */}
      <section className="space-y-3 border-b border-border/50 pb-8">
        <h2 className="text-2xl font-semibold text-foreground">
          3. How We Use Your Information
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          We use the information we collect for the following purposes:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed text-muted-foreground">
          <li>
            To provide, operate, and maintain the App&apos;s core features
            (salary tracking, budget management, bill tracking, expense
            recording).
          </li>
          <li>To authenticate your identity and secure your account.</li>
          <li>
            To send you email notifications and reminders (such as bill due date
            reminders) via our email service provider.
          </li>
          <li>
            To improve and optimize the App&apos;s performance and user
            experience.
          </li>
          <li>To respond to your inquiries and provide customer support.</li>
          <li>
            To detect, prevent, and address technical issues or security
            threats.
          </li>
        </ul>
        <p className="text-sm leading-relaxed text-muted-foreground">
          We do not sell, rent, or share your personal or financial data with
          third parties for advertising or marketing purposes.
        </p>
      </section>

      {/* Data Storage & Security */}
      <section className="space-y-3 border-b border-border/50 pb-8">
        <h2 className="text-2xl font-semibold text-foreground">
          4. Data Storage &amp; Security
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Your data is stored securely using Supabase, a hosted PostgreSQL
          database platform. Supabase provides enterprise-grade security
          features including:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed text-muted-foreground">
          <li>
            Data encryption at rest and in transit (TLS/SSL encryption).
          </li>
          <li>
            Row-Level Security (RLS) policies to ensure users can only access
            their own data.
          </li>
          <li>
            Secure authentication through Supabase Auth with hashed password
            storage.
          </li>
          <li>Regular database backups managed by Supabase infrastructure.</li>
        </ul>
        <p className="text-sm leading-relaxed text-muted-foreground">
          While we implement industry-standard security measures to protect your
          data, no method of electronic storage or transmission over the
          internet is 100% secure. We cannot guarantee absolute security of your
          data.
        </p>
      </section>

      {/* Email Communications */}
      <section className="space-y-3 border-b border-border/50 pb-8">
        <h2 className="text-2xl font-semibold text-foreground">
          5. Email Communications
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          We use Resend, a third-party email delivery service, to send you
          transactional and notification emails. These emails may include:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed text-muted-foreground">
          <li>Account verification and password reset emails.</li>
          <li>Bill due date reminders and payment notifications.</li>
          <li>Budget alerts and summary reports.</li>
          <li>Important service announcements and updates.</li>
        </ul>
        <p className="text-sm leading-relaxed text-muted-foreground">
          When we send emails through Resend, your email address is shared with
          Resend solely for the purpose of delivering these messages. Resend
          processes this data in accordance with their own privacy policy. We do
          not share any of your financial data with Resend.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          You may manage your email notification preferences within the App
          settings.
        </p>
      </section>

      {/* Cookies & Local Storage */}
      <section className="space-y-3 border-b border-border/50 pb-8">
        <h2 className="text-2xl font-semibold text-foreground">
          6. Cookies &amp; Local Storage
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The App uses cookies and browser local storage for the following
          purposes:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed text-muted-foreground">
          <li>
            Session management and authentication (keeping you logged in).
          </li>
          <li>Storing user interface preferences (such as theme settings).</li>
          <li>Caching non-sensitive application state for performance.</li>
        </ul>
        <p className="text-sm leading-relaxed text-muted-foreground">
          We do not use third-party tracking cookies or advertising cookies. The
          cookies and local storage we use are strictly functional and necessary
          for the operation of the App.
        </p>
      </section>

      {/* Data Retention */}
      <section className="space-y-3 border-b border-border/50 pb-8">
        <h2 className="text-2xl font-semibold text-foreground">
          7. Data Retention
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          We retain your personal and financial data for as long as your account
          remains active. If you choose to delete your account:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed text-muted-foreground">
          <li>
            Your personal data and financial records will be permanently deleted
            from our database within 30 days of your account deletion request.
          </li>
          <li>
            Certain anonymized, aggregated data may be retained for analytical
            purposes but will not be linked back to your identity.
          </li>
          <li>
            Backup copies may persist in our backup systems for a limited period
            before being automatically purged.
          </li>
        </ul>
      </section>

      {/* Your Rights */}
      <section className="space-y-3 border-b border-border/50 pb-8">
        <h2 className="text-2xl font-semibold text-foreground">
          8. Your Rights
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Depending on your jurisdiction, you may have the following rights
          regarding your personal data:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">
              Right to Access:
            </span>{" "}
            You can request a copy of the personal data we hold about you.
          </li>
          <li>
            <span className="font-medium text-foreground">
              Right to Rectification:
            </span>{" "}
            You can update or correct your personal information at any time
            through the App.
          </li>
          <li>
            <span className="font-medium text-foreground">
              Right to Deletion:
            </span>{" "}
            You can request the deletion of your account and all associated
            data.
          </li>
          <li>
            <span className="font-medium text-foreground">
              Right to Data Portability:
            </span>{" "}
            You can request an export of your data in a standard,
            machine-readable format.
          </li>
          <li>
            <span className="font-medium text-foreground">
              Right to Withdraw Consent:
            </span>{" "}
            You can withdraw consent for non-essential data processing at any
            time.
          </li>
        </ul>
        <p className="text-sm leading-relaxed text-muted-foreground">
          To exercise any of these rights, please contact us using the
          information provided below.
        </p>
      </section>

      {/* Third-Party Services */}
      <section className="space-y-3 border-b border-border/50 pb-8">
        <h2 className="text-2xl font-semibold text-foreground">
          9. Third-Party Services
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The App integrates with the following third-party services to provide
          its functionality:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">Supabase:</span>{" "}
            Database hosting, authentication, and data storage. Supabase
            processes and stores your account and financial data on our behalf.
          </li>
          <li>
            <span className="font-medium text-foreground">Resend:</span>{" "}
            Email delivery service used for transactional and notification
            emails. Resend processes your email address for delivery purposes
            only.
          </li>
        </ul>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Each third-party service operates under its own privacy policy and
          terms of service. We encourage you to review their policies. We only
          share the minimum data necessary for each service to fulfill its
          function.
        </p>
      </section>

      {/* Children's Privacy */}
      <section className="space-y-3 border-b border-border/50 pb-8">
        <h2 className="text-2xl font-semibold text-foreground">
          10. Children&apos;s Privacy
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Salary Dashboard is not intended for use by individuals under the age
          of 18. We do not knowingly collect personal information from children.
          If we become aware that we have collected data from a child under 18,
          we will take steps to promptly delete that information from our
          systems.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          If you are a parent or guardian and believe that your child has
          provided us with personal information, please contact us immediately.
        </p>
      </section>

      {/* Changes to Policy */}
      <section className="space-y-3 border-b border-border/50 pb-8">
        <h2 className="text-2xl font-semibold text-foreground">
          11. Changes to This Privacy Policy
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          We may update this Privacy Policy from time to time to reflect changes
          in our practices, technology, legal requirements, or other factors.
          When we make changes, we will update the &quot;Last updated&quot; date
          at the top of this page.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          We encourage you to review this Privacy Policy periodically. Your
          continued use of the App after any changes to this policy constitutes
          your acceptance of the updated terms.
        </p>
      </section>

      {/* Contact */}
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold text-foreground">
          12. Contact Information
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          If you have any questions, concerns, or requests regarding this
          Privacy Policy or your personal data, please contact us at:
        </p>
        <p className="text-sm font-medium text-foreground">
          salarydashboard@support.com
        </p>
      </section>
    </>
  );
}
