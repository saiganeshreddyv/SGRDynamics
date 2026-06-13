import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    const lead = req.body;

    // =========================
    // EMAIL TO ADMIN (YOU)
    // =========================
    const adminMail = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: ["saiganeshreddy2276@gmail.com"],
      subject: `New Lead - ${lead.full_name}`,
      html: `
        <h2>New Lead Received</h2>

        <p><strong>Name:</strong> ${lead.full_name}</p>
        <p><strong>Email:</strong> ${lead.email}</p>
        <p><strong>Phone:</strong> ${lead.phone}</p>
        <p><strong>Company:</strong> ${lead.company}</p>
        <p><strong>Industry:</strong> ${lead.industry}</p>
        <p><strong>Service:</strong> ${lead.service}</p>
        <p><strong>Preferred Contact:</strong> ${lead.preferred_contact}</p>

        <hr />

        <h3>Requirements</h3>
        <p>${lead.requirements}</p>
      `,
    });

    console.log("ADMIN EMAIL:", adminMail);

    // =========================
    // AUTO REPLY TO CLIENT
    // =========================
    if (lead.email) {
      const userMail = await resend.emails.send({
        from: "onboarding@resend.dev",
        to: [lead.email],
        subject: "We've Received Your Consultation Request",
        html: `
          <div style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: auto;
            padding: 30px;
            background: #ffffff;
          ">
            <h1 style="color:#c86b5b;">
              Thank You For Contacting SGR Dynamics
            </h1>

            <p>Hi ${lead.full_name},</p>

            <p>
              Thank you for contacting SGR Dynamics.
              We received your consultation request successfully.
            </p>

            <p>
              Our team will review your requirements and contact you soon.
            </p>

            <div style="
              background:#f7f7f7;
              padding:20px;
              border-radius:10px;
              margin-top:20px;
            ">
              <strong>Requested Service:</strong> ${lead.service}<br/>
              <strong>Company:</strong> ${lead.company || "N/A"}<br/>
              <strong>Preferred Contact:</strong> ${
                lead.preferred_contact || "N/A"
              }
            </div>

            <p style="margin-top:30px;">
              Regards,<br/>
              <strong>SGR Dynamics</strong><br/>
              Web Development • Mobile Applications • AI Automation
            </p>
          </div>
        `,
      });

      console.log("USER EMAIL:", userMail);
    }

    return res.status(200).json({
      success: true,
      message: "Emails sent successfully",
    });
  } catch (error: any) {
    console.error("SENDLEAD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}