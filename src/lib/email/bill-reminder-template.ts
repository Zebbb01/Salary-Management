/**
 * Bill Reminder Email Template
 *
 * Generates responsive HTML email that adapts to dark/light mode
 * via @media (prefers-color-scheme: dark) and is compatible
 * with all major email clients (Gmail, Outlook, Apple Mail, mobile).
 */

interface BillItem {
  category: string;
  amount: number;
  description?: string | null;
}

interface TemplateData {
  userName: string;
  unpaidBills: BillItem[];
  totalDue: number;
  month: string; // e.g. "June 2026"
  dashboardUrl: string;
}

function formatPeso(amount: number): string {
  return `PHP ${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function generateBillReminderEmail(data: TemplateData): string {
  const billRows = data.unpaidBills
    .map(
      (bill) => `
        <tr>
          <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #1f2937;">
            <!--[if mso]><span style="color: #1f2937;"><![endif]-->
            <span class="bill-name">${bill.category}</span>
            ${bill.description ? `<br><span class="bill-desc" style="font-size: 12px; color: #6b7280;">${bill.description}</span>` : ''}
          </td>
          <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #ef4444; text-align: right; font-weight: 600; font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;">
            <span class="bill-amount">${formatPeso(bill.amount)}</span>
          </td>
        </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Unpaid Bills Reminder - ${data.month}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; }

    /* Base Light Mode */
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }
    body {
      background-color: #f3f4f6 !important;
      color: #1f2937;
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    .email-wrapper { background-color: #f3f4f6; }
    .email-body { background-color: #ffffff; border: 1px solid #e5e7eb; }
    .email-header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); }
    .header-title { color: #ffffff !important; }
    .header-subtitle { color: rgba(255,255,255,0.85) !important; }
    .alert-box { background-color: #fef3c7; border: 1px solid #f59e0b; }
    .alert-icon { color: #d97706; }
    .alert-text { color: #92400e; }
    .alert-count { color: #b45309; }
    .section-title { color: #111827; }
    .bill-name { color: #1f2937; }
    .bill-desc { color: #6b7280; }
    .bill-amount { color: #ef4444; }
    .total-row { background-color: #f9fafb; }
    .total-label { color: #374151; }
    .total-amount { color: #dc2626; }
    .cta-button { background-color: #059669 !important; }
    .cta-text { color: #ffffff !important; }
    .footer-text { color: #9ca3af; }
    .divider { border-color: #e5e7eb; }
    table.bill-table tr td { border-bottom-color: #e5e7eb; }

    /* Dark Mode */
    @media (prefers-color-scheme: dark) {
      body { background-color: #111827 !important; color: #e5e7eb; }
      .email-wrapper { background-color: #111827 !important; }
      .email-body { background-color: #1f2937 !important; border-color: #374151 !important; }
      .email-header { background: linear-gradient(135deg, #047857 0%, #059669 100%) !important; }
      .alert-box { background-color: #451a03 !important; border-color: #b45309 !important; }
      .alert-text { color: #fde68a !important; }
      .alert-count { color: #fbbf24 !important; }
      .section-title { color: #f3f4f6 !important; }
      .bill-name { color: #e5e7eb !important; }
      .bill-desc { color: #9ca3af !important; }
      .bill-amount { color: #f87171 !important; }
      .total-row { background-color: #111827 !important; }
      .total-label { color: #d1d5db !important; }
      .total-amount { color: #f87171 !important; }
      table.bill-table tr td { border-bottom-color: #374151 !important; color: #e5e7eb !important; }
      .divider { border-color: #374151 !important; }
      .footer-text { color: #6b7280 !important; }

      /* Outlook dark mode */
      [data-ogsc] .email-body { background-color: #1f2937 !important; }
      [data-ogsc] .bill-name { color: #e5e7eb !important; }
      [data-ogsc] .alert-text { color: #fde68a !important; }
    }

    /* Responsive */
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; padding: 0 12px !important; }
      .email-body { border-radius: 12px !important; }
      .inner-padding { padding: 20px 16px !important; }
      .header-padding { padding: 24px 16px !important; }
      .cta-button { display: block !important; width: 100% !important; text-align: center !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0;">
  <div class="email-wrapper" style="width: 100%; padding: 32px 0;">
    <!--[if mso]>
    <table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0" border="0">
    <tr><td>
    <![endif]-->
    <div class="email-container" style="max-width: 600px; margin: 0 auto; padding: 0 16px;">

      <!-- Header -->
      <div class="email-header" style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); border-radius: 16px 16px 0 0; padding: 32px 28px;" class="header-padding">
        <h1 class="header-title" style="margin: 0 0 4px; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">
          Salary Dashboard
        </h1>
        <p class="header-subtitle" style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.85);">
          Bill Payment Reminder
        </p>
      </div>

      <!-- Body -->
      <div class="email-body" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">

        <!-- Alert Box -->
        <div class="inner-padding" style="padding: 28px 28px 0;">
          <div class="alert-box" style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 10px; padding: 16px 18px; display: flex; align-items: flex-start; gap: 12px;">
            <div>
              <p class="alert-text" style="margin: 0 0 2px; font-size: 14px; font-weight: 600; color: #92400e;">
                You have <span class="alert-count" style="color: #b45309;">${data.unpaidBills.length} unpaid bill${data.unpaidBills.length !== 1 ? 's' : ''}</span> for ${data.month}
              </p>
              <p class="alert-text" style="margin: 0; font-size: 13px; color: #92400e; opacity: 0.8;">
                Please review and mark them as paid in your dashboard.
              </p>
            </div>
          </div>
        </div>

        <!-- Bills Table -->
        <div class="inner-padding" style="padding: 24px 28px;">
          <h2 class="section-title" style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #111827; letter-spacing: -0.01em;">
            Unpaid Bills
          </h2>
          <table class="bill-table" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
            <thead>
              <tr>
                <th style="padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; border-bottom: 2px solid #e5e7eb;">
                  Bill
                </th>
                <th style="padding: 10px 16px; text-align: right; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; border-bottom: 2px solid #e5e7eb;">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              ${billRows}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td class="total-label" style="padding: 16px; font-size: 14px; font-weight: 700; color: #374151; background-color: #f9fafb; border-radius: 0 0 0 8px;">
                  Total Due
                </td>
                <td class="total-amount" style="padding: 16px; font-size: 16px; font-weight: 700; color: #dc2626; text-align: right; background-color: #f9fafb; border-radius: 0 0 8px 0; font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;">
                  ${formatPeso(data.totalDue)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Divider -->
        <hr class="divider" style="margin: 0 28px; border: none; border-top: 1px solid #e5e7eb;">

        <!-- CTA -->
        <div class="inner-padding" style="padding: 28px; text-align: center;">
          <p style="margin: 0 0 20px; font-size: 14px; color: #6b7280;">
            Open your dashboard to review and mark bills as paid.
          </p>
          <a href="${data.dashboardUrl}" class="cta-button" style="display: inline-block; background-color: #059669; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 10px; letter-spacing: -0.01em;">
            <span class="cta-text" style="color: #ffffff;">Open Dashboard</span>
          </a>
        </div>
      </div>

      <!-- Footer -->
      <div style="padding: 24px 16px; text-align: center;">
        <p class="footer-text" style="margin: 0 0 4px; font-size: 12px; color: #9ca3af;">
          Salary Dashboard - Personal Finance Tracker
        </p>
        <p class="footer-text" style="margin: 0; font-size: 11px; color: #9ca3af;">
          This is an automated reminder. You can disable these in your dashboard settings.
        </p>
      </div>

    </div>
    <!--[if mso]>
    </td></tr>
    </table>
    <![endif]-->
  </div>
</body>
</html>`;
}

export function generateBillReminderSubject(data: TemplateData): string {
  return `${data.unpaidBills.length} unpaid bill${data.unpaidBills.length !== 1 ? 's' : ''} for ${data.month} - Salary Dashboard`;
}
