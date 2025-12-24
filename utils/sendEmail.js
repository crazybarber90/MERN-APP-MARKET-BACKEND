const nodemailer = require('nodemailer')
const { google } = require('googleapis')
require('dotenv').config()

const oAuth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET
)

oAuth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
})

const sendEmail = async (subject, message, send_to, sent_from, reply_to) => {
  try {
    const accessToken = await oAuth2Client.getAccessToken()

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.GMAIL_USER,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        accessToken: accessToken.token,
      },
    })

    await transporter.verify()
    console.log('✅ GMAIL SMTP READY')

    const info = await transporter.sendMail({
      from: sent_from || process.env.GMAIL_USER,
      to: send_to,
      replyTo: reply_to || process.env.GMAIL_USER,
      subject,
      html: message,
    })

    console.log('📨 MAIL SENT:', info.messageId)
    return info
  } catch (err) {
    console.error('❌ GMAIL SEND ERROR:', err)
    throw err
  }
}

module.exports = sendEmail
