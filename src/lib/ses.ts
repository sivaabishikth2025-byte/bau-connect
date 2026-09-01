import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

export function parseFrom(raw: string) {
  const match = raw.match(/^(.*)<([^>]+)>$/);
  if (match) {
    return {
      name: match[1].trim().replace(/^"|"$/g, "") || "BAU Connect",
      email: match[2].trim(),
    };
  }
  return { name: "BAU Connect", email: raw.trim() };
}

export function getSesConfig() {
  const region = process.env.SES_REGION || "us-east-1";
  const fromRaw = process.env.SES_FROM_EMAIL || process.env.AWS_SES_FROM_EMAIL;
  const accessKeyId = process.env.SES_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.SES_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
  return { region, fromRaw, accessKeyId, secretAccessKey };
}

export async function sendSesEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const { region, fromRaw, accessKeyId, secretAccessKey } = getSesConfig();
  if (!fromRaw) throw new Error("SES_FROM_EMAIL is not set");
  if (!accessKeyId || !secretAccessKey) throw new Error("AWS credentials are not set");

  const from = parseFrom(fromRaw);
  const client = new SESv2Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });

  const result = await client.send(
    new SendEmailCommand({
      FromEmailAddress: `${from.name} <${from.email}>`,
      Destination: { ToAddresses: [opts.to] },
      ReplyToAddresses: [from.email],
      Content: {
        Simple: {
          Subject: { Data: opts.subject, Charset: "UTF-8" },
          Body: {
            Html: { Data: opts.html, Charset: "UTF-8" },
            Text: { Data: opts.text, Charset: "UTF-8" },
          },
        },
      },
    })
  );

  return result.MessageId;
}
