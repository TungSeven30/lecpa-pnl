import { Resend } from 'resend';

interface SendMagicLinkOptions {
  resendApiKey: string;
  email: string;
  token: string;
  appUrl: string;
}

export async function sendMagicLink(options: SendMagicLinkOptions): Promise<{ success: boolean; error?: string }> {
  const { resendApiKey, email, token, appUrl } = options;
  const resend = new Resend(resendApiKey);

  const verifyUrl = `${appUrl}/auth/verify?token=${token}`;

  try {
    const { data, error } = await resend.emails.send({
      from: 'LeCPA P&L <onboarding@resend.dev>', // Use resend.dev for testing
      to: email,
      subject: 'Your login link - LeCPA P&L Generator',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Log in to LeCPA P&L Generator</h2>
          <p>Click the button below to log in. This link expires in 15 minutes.</p>
          <a href="${verifyUrl}"
             style="display: inline-block; background: #2563eb; color: white;
                    padding: 12px 24px; text-decoration: none; border-radius: 6px;
                    margin: 16px 0;">
            Log in to your account
          </a>
          <p style="color: #666; font-size: 14px;">
            If you didn't request this link, you can safely ignore this email.
          </p>
          <p style="color: #999; font-size: 12px;">
            Link: ${verifyUrl}
          </p>
        </div>
      `
    });

    if (error) {
      console.error('Resend error:', JSON.stringify(error));
      return { success: false, error: error.message };
    }

    console.log('Magic link email sent:', { to: email, id: data?.id });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Email send failed:', message);
    return { success: false, error: message };
  }
}
