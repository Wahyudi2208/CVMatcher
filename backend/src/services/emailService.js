import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendOTPEmail = async (
    email,
    otp
) => {
    await transporter.sendMail({
        from: `"CVMatcher AI" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Kode OTP Reset Password",
        html: `
            <div
                style="
                    font-family: Arial, sans-serif;
                    line-height:1.6;
                "
            >
                <h2>
                    Reset Password
                </h2>
                <p>
                    Halo,
                </p>
                <p>
                    Gunakan kode OTP berikut untuk
                    mengatur ulang kata sandi akun Anda.
                </p>
                <div
                    style="
                        font-size:32px;
                        font-weight:bold;
                        letter-spacing:8px;
                        color:#1056a8;
                        margin:24px 0;
                    "
                >
                    ${otp}
                </div>
                <p>
                    OTP hanya berlaku selama
                    <strong>2 menit</strong>.
                </p>
                <p>
                    Jangan bagikan kode ini kepada siapa pun.
                </p>
                <br>
                <p>
                    CVMatcher AI
                </p>
            </div>
        `
    });
};