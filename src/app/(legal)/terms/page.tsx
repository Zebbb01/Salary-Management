import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - Salary Dashboard",
  description:
    "Terms of Service for Salary Dashboard, a personal finance tool for Filipino professionals.",
};

export default function TermsOfServicePage() {
  return (
    <>
      {/* Disclaimer */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-5 py-4">
        <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
          Disclaimer
        </p>
        <p className="mt-1 text-xs leading-relaxed text-amber-600/80 dark:text-amber-400/80">
          This is a placeholder Terms of Service document and does not
          constitute actual legal advice. Consult a qualified attorney for
          legally binding terms appropriate to your jurisdiction and use case.
        </p>
      </div>

      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Terms of Service
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
          Welcome to Salary Dashboard (&quot;the App,&quot; &quot;we,&quot;
          &quot;us,&quot; or &quot;our&quot;). Salary Dashboard is a personal
          finance tool designed for Filipino professionals to track salary
          income, manage budget allocations, monitor bills, and record expenses.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          By accessing or using the App, you agree to be bound by these Terms of
          Service (&quot;Terms&quot;). If you do not agree to these Terms, you
          must not use the App.
        </p>
      </section>

      {/* Account Terms */}
      <section className="space-y-3 border-b border-border/50 pb-8">
        <h2 className="text-2xl font-semibold text-foreground">
          2. Account Terms
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          To use Salary Dashboard, you must create an account. You agree to the
          following:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed text-muted-foreground">
          <li>
            You must provide accurate and complete information when creating
            your account.
          </li>
          <li>
            You are responsible for maintaining the confidentiality of your
            account credentials.
          </li>
          <li>
            You are responsible for all activities that occur under your account.
          </li>
          <li>
            You must be at least 18 years of age to create an account and use
            the App.
          </li>
          <li>
            You must notify us immediately of any unauthorized use of your
            account.
          </li>
          <li>
            We reserve the right to suspend or terminate accounts that violate
            these Terms.
          </li>
        </ul>
      </section>

      {/* Acceptable Use */}
      <section className="space-y-3 border-b border-border/50 pb-8">
        <h2 className="text-2xl font-semibold text-foreground">
          3. Acceptable Use
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          You agree to use Salary Dashboard only for lawful purposes and in
          accordance with these Terms. You agree not to:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed text-muted-foreground">
          <li>
            Use the App for any illegal, fraudulent, or unauthorized purpose.
          </li>
          <li>
            Attempt to gain unauthorized access to the App, its servers, or any
            connected systems.
          </li>
          <li>
            Interfere with or disrupt the integrity or performance of the App.
          </li>
          <li>
            Upload or transmit malicious code, viruses, or harmful data.
          </li>
          <li>
            Use automated systems (bots, scrapers) to access the App without
            prior written consent.
          </li>
          <li>
            Impersonate another person or misrepresent your affiliation with any
            entity.
          </li>
        </ul>
      </section>

      {/* Data & Privacy */}
      <section className="space-y-3 border-b border-border/50 pb-8">
        <h2 className="text-2xl font-semibold text-foreground">
          4. Data &amp; Privacy
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Your privacy is important to us. Our collection, use, and protection
          of your personal and financial data is governed by our Privacy Policy.
          By using the App, you consent to the practices described in the
          Privacy Policy.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          You retain ownership of all financial data you enter into the App. We
          do not sell, share, or distribute your personal or financial data to
          third parties for marketing purposes.
        </p>
      </section>

      {/* Financial Disclaimer */}
      <section className="space-y-3 border-b border-border/50 pb-8">
        <h2 className="text-2xl font-semibold text-foreground">
          5. Financial Disclaimer
        </h2>
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-5 py-4">
          <p className="text-sm font-medium leading-relaxed text-destructive">
            Important: Salary Dashboard is NOT a financial advisory service.
          </p>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The App is a personal finance tracking and budgeting tool only. The
          information, features, and calculations provided by the App are for
          informational and organizational purposes only and should not be
          construed as:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed text-muted-foreground">
          <li>Financial advice, investment advice, or tax advice.</li>
          <li>
            A recommendation to make or refrain from making any financial
            decision.
          </li>
          <li>
            A substitute for professional consultation with a qualified
            financial advisor, accountant, or tax professional.
          </li>
        </ul>
        <p className="text-sm leading-relaxed text-muted-foreground">
          You are solely responsible for your financial decisions. We do not
          guarantee the accuracy, completeness, or timeliness of any
          calculations, budget suggestions, or data presented in the App. Always
          consult a licensed financial professional before making significant
          financial decisions.
        </p>
      </section>

      {/* Intellectual Property */}
      <section className="space-y-3 border-b border-border/50 pb-8">
        <h2 className="text-2xl font-semibold text-foreground">
          6. Intellectual Property
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          All content, features, functionality, design, code, and branding of
          Salary Dashboard (excluding user-submitted data) are owned by us and
          are protected by intellectual property laws.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          You may not copy, modify, distribute, sell, or lease any part of the
          App or its content without our prior written consent.
        </p>
      </section>

      {/* Limitation of Liability */}
      <section className="space-y-3 border-b border-border/50 pb-8">
        <h2 className="text-2xl font-semibold text-foreground">
          7. Limitation of Liability
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          To the maximum extent permitted by applicable law, Salary Dashboard
          and its creators shall not be liable for any indirect, incidental,
          special, consequential, or punitive damages, including but not limited
          to:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed text-muted-foreground">
          <li>Loss of data, revenue, or profits.</li>
          <li>
            Financial losses resulting from reliance on the App&apos;s
            calculations or data.
          </li>
          <li>Service interruptions or downtime.</li>
          <li>Unauthorized access to your account due to compromised credentials.</li>
          <li>
            Errors, inaccuracies, or omissions in the data presented by the
            App.
          </li>
        </ul>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The App is provided on an &quot;as is&quot; and &quot;as
          available&quot; basis without warranties of any kind, either express or
          implied.
        </p>
      </section>

      {/* Changes to Terms */}
      <section className="space-y-3 border-b border-border/50 pb-8">
        <h2 className="text-2xl font-semibold text-foreground">
          8. Changes to Terms
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          We reserve the right to modify or update these Terms at any time. When
          we make changes, we will update the &quot;Last updated&quot; date at
          the top of this page. Your continued use of the App after changes are
          posted constitutes your acceptance of the revised Terms.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          We encourage you to review these Terms periodically to stay informed
          of any updates.
        </p>
      </section>

      {/* Contact */}
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold text-foreground">
          9. Contact Information
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          If you have any questions, concerns, or feedback regarding these Terms
          of Service, please contact us at:
        </p>
        <p className="text-sm font-medium text-foreground">
          salarydashboard@support.com
        </p>
      </section>
    </>
  );
}
