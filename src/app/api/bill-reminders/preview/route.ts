import { NextResponse } from 'next/server';
import { generateBillReminderEmail } from '@/lib/email/bill-reminder-template';

/**
 * GET /api/bill-reminders/preview
 *
 * Returns the bill reminder email HTML so you can preview it in your browser.
 * Uses sample data -- no authentication required.
 * Only available in development mode.
 */
export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Preview is only available in development mode.' },
      { status: 403 }
    );
  }

  const sampleData = {
    userName: 'Gerald',
    unpaidBills: [
      { category: 'Rent', amount: 4000, description: 'Boarding House' },
      { category: 'Electric Bill', amount: 250, description: 'Electricity' },
      { category: 'Consumable', amount: 4500, description: 'Food, drinking water, daily necessities' },
      { category: 'House Wifi', amount: 1710, description: 'Wifi' },
      { category: 'House Bills', amount: 3000, description: 'Electric, Water, Wifi' },
    ],
    totalDue: 13460,
    month: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    dashboardUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  };

  const html = generateBillReminderEmail(sampleData);

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
