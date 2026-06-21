type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

type EmailProviderResult = {
  provider: "resend" | "brevo";
  id?: string;
};

const resendApiKey = process.env.RESEND_API_KEY;
const brevoApiKey = process.env.BREVO_API_KEY;
const fallbackFromEmail = process.env.EMAIL_FROM;
const fallbackFromName = process.env.EMAIL_FROM_NAME ?? "Commander Control";

export async function sendEmail(input: SendEmailInput): Promise<EmailProviderResult> {
  let resendError: Error | null = null;
  const resendFrom = process.env.RESEND_FROM_EMAIL ?? fallbackFromEmail;
  if (resendApiKey && resendFrom) {
    try {
      return await sendWithResend(input, resendFrom);
    } catch (error) {
      resendError = error instanceof Error ? error : new Error("Resend email delivery failed.");
      // Brevo is the configured fallback when Resend is unavailable or rejects the send.
    }
  }

  const brevoFrom = process.env.BREVO_FROM_EMAIL ?? fallbackFromEmail;
  const brevoFromName = process.env.BREVO_FROM_NAME ?? fallbackFromName;
  if (brevoApiKey && brevoFrom) {
    return sendWithBrevo(input, brevoFrom, brevoFromName);
  }

  if (resendError) {
    throw new Error(`Resend failed and Brevo fallback is not configured: ${resendError.message}`);
  }

  throw new Error("No email provider is configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL, or BREVO_API_KEY and BREVO_FROM_EMAIL.");
}

async function sendWithResend(input: SendEmailInput, from: string): Promise<EmailProviderResult> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text
    })
  });

  const result = (await response.json().catch(() => ({}))) as { id?: string; message?: string; error?: string };
  if (!response.ok) {
    throw new Error(result.message ?? result.error ?? "Resend email delivery failed.");
  }

  return { provider: "resend", id: result.id };
}

async function sendWithBrevo(input: SendEmailInput, from: string, fromName: string): Promise<EmailProviderResult> {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "api-key": brevoApiKey!,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      sender: {
        email: from,
        name: fromName
      },
      to: [{ email: input.to }],
      subject: input.subject,
      htmlContent: input.html,
      textContent: input.text
    })
  });

  const result = (await response.json().catch(() => ({}))) as { messageId?: string; message?: string; code?: string };
  if (!response.ok) {
    throw new Error(result.message ?? result.code ?? "Brevo email delivery failed.");
  }

  return { provider: "brevo", id: result.messageId };
}
