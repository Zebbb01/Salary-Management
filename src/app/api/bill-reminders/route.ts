import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import {
  generateBillReminderEmail,
  generateBillReminderSubject,
} from '@/lib/email/bill-reminder-template';

// ---------------------------------------------------------------------------
// POST - Manual trigger (authenticated user sends email to themselves)
// ---------------------------------------------------------------------------
export async function POST() {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY is not configured. Add it to your .env.local file.' },
        { status: 500 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return await sendReminderForUser(resend, user.id, user.email!);
  } catch (err) {
    console.error('Bill reminder error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// GET - Cron trigger (runs daily during 1st week and 3rd week)
// Vercel Cron calls this via GET. Protected by CRON_SECRET header.
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if today is in the 1st week (days 1-7) or 3rd week (days 15-21)
    const today = new Date();
    const dayOfMonth = today.getDate();
    const isReminderWeek =
      (dayOfMonth >= 1 && dayOfMonth <= 7) ||
      (dayOfMonth >= 15 && dayOfMonth <= 21);

    if (!isReminderWeek) {
      return NextResponse.json({
        message: `Day ${dayOfMonth} is not in reminder weeks (1-7 or 15-21). Skipping.`,
        sent: false,
      });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY is not configured.' },
        { status: 500 }
      );
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY is not configured.' },
        { status: 500 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Use service role to query all users with unpaid bills
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const currentMonth = today.toISOString().slice(0, 7);

    // Get all distinct users who have unpaid bills this month
    const { data: unpaidBills, error } = await adminClient
      .from('bill_payments')
      .select('user_id')
      .eq('month', currentMonth)
      .eq('is_paid', false);

    if (error) {
      console.error('Failed to fetch unpaid bills:', error);
      return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 });
    }

    // Get unique user IDs
    const userIds = [...new Set((unpaidBills ?? []).map((b) => b.user_id))];

    if (userIds.length === 0) {
      return NextResponse.json({
        message: 'No users with unpaid bills. No emails sent.',
        sent: false,
      });
    }

    // Get user emails from auth.users
    let emailsSent = 0;
    for (const userId of userIds) {
      const { data: userData } = await adminClient.auth.admin.getUserById(userId);
      if (userData?.user?.email) {
        const result = await sendReminderForUser(resend, userId, userData.user.email);
        const body = await result.json();
        if (body.sent) emailsSent++;
      }
    }

    return NextResponse.json({
      message: `Cron completed. ${emailsSent} email(s) sent.`,
      emailsSent,
      totalUsers: userIds.length,
    });
  } catch (err) {
    console.error('Cron bill reminder error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Shared helper: send reminder email for a specific user
// ---------------------------------------------------------------------------
async function sendReminderForUser(
  resend: Resend,
  userId: string,
  userEmail: string
): Promise<NextResponse> {
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);
  const monthLabel = now.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // Get unpaid bills with allocation details
  const { data: unpaidBills, error: billsError } = await adminClient
    .from('bill_payments')
    .select(`
      *,
      allocation:budget_allocations(category, description)
    `)
    .eq('month', currentMonth)
    .eq('is_paid', false)
    .eq('user_id', userId);

  if (billsError) {
    return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 });
  }

  if (!unpaidBills || unpaidBills.length === 0) {
    return NextResponse.json({
      message: 'No unpaid bills. No email sent.',
      sent: false,
    });
  }

  const billItems = unpaidBills.map((bill) => ({
    category: (bill.allocation as { category: string })?.category ?? 'Unknown',
    amount: Number(bill.amount),
    description: (bill.allocation as { description: string | null })?.description ?? null,
  }));

  const totalDue = billItems.reduce((sum, b) => sum + b.amount, 0);

  const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
    : 'http://localhost:3000/dashboard';

  const templateData = {
    userName: userEmail.split('@')[0],
    unpaidBills: billItems,
    totalDue,
    month: monthLabel,
    dashboardUrl,
  };

  const html = generateBillReminderEmail(templateData);
  const subject = generateBillReminderSubject(templateData);

  const { error: sendError } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'Salary Dashboard <onboarding@resend.dev>',
    to: userEmail,
    subject,
    html,
  });

  if (sendError) {
    console.error('Resend error:', sendError);
    return NextResponse.json(
      { error: 'Failed to send email', details: sendError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: `Email sent to ${userEmail}`,
    sent: true,
    billCount: unpaidBills.length,
    totalDue,
  });
}
