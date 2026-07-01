import { NextResponse } from 'next/server';

export const maxDuration = 30; // Max timeout for the serverless function

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const ENDPOINT = 'https://models.inference.ai.azure.com/chat/completions';
const MODEL = 'gpt-4o-mini'; // Fast, free on GitHub Models, supports vision

export async function POST(req: Request) {
  try {
    if (!GITHUB_TOKEN) {
      return NextResponse.json(
        { error: 'GITHUB_TOKEN is not configured in environment variables.' },
        { status: 500 }
      );
    }

    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Prepare prompt
    const systemPrompt = `You are a highly accurate OCR and financial data extraction assistant. 
Your task is to analyze the provided payslip image and extract the following numerical values:
1. Gross Pay (Total income before any deductions)
2. Total Deductions (Sum of all deductions)
3. Net Pay (Take-home pay)
4. SSS Contribution (Look for 'SSS+MPF Share' or similar)
5. Pag-IBIG Contribution (Look for 'Pag-ibig' or 'Pag-IBIG')
6. PhilHealth Contribution (Look for 'Philhealth')
7. Tax Withheld (Look for 'Tax Withheld')
8. Any Loans (Sum of SSS Loan, Pag-ibig Loan, etc.)

Instructions:
- Return ONLY a valid JSON object. No markdown formatting like \`\`\`json, just the raw JSON.
- If a value is missing or unreadable, set it to 0.
- Ensure Gross Pay - Total Deductions roughly equals Net Pay if all are visible.
- Remove all commas and currency symbols. Return raw numbers.

Expected JSON schema:
{
  "gross_pay": number,
  "total_deductions": number,
  "net_pay": number,
  "sss": number,
  "pag_ibig": number,
  "philhealth": number,
  "tax_withheld": number,
  "loans": number
}`;

    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GITHUB_TOKEN}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64,
                },
              },
            ],
          },
        ],
        temperature: 0.1, // Low temperature for factual extraction
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GitHub Models API error:', errorText);
      return NextResponse.json(
        { error: `GitHub Models API failed: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const messageContent = data.choices[0].message.content;
    
    // Clean up potential markdown formatting from the LLM
    let cleanJson = messageContent.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.substring(7);
    }
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.substring(3);
    }
    if (cleanJson.endsWith('```')) {
      cleanJson = cleanJson.substring(0, cleanJson.length - 3);
    }
    
    const parsedData = JSON.parse(cleanJson.trim());

    return NextResponse.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Payslip analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze payslip' },
      { status: 500 }
    );
  }
}
