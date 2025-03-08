import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

let transporter = null;

app.post('/api/test-connection', async (req, res) => {
  const { host, port, username, password } = req.body;
  
  try {
    if (transporter) {
      await transporter.close();
    }

    transporter = nodemailer.createTransport({
      host,
      port: parseInt(port, 10),
      secure: parseInt(port, 10) === 465,
      auth: {
        user: username,
        pass: password
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    await new Promise((resolve, reject) => {
      transporter.verify((error, success) => {
        if (error) {
          reject(error);
        } else {
          resolve(success);
        }
      });
    });

    res.json({ 
      success: true, 
      message: 'Connection successful!' 
    });
  } catch (error) {
    console.error('SMTP Connection Error:', error);
    
    if (transporter) {
      await transporter.close();
      transporter = null;
    }

    res.status(400).json({ 
      success: false, 
      message: 'Connection failed: ' + (error.message || 'Unknown error occurred')
    });
  }
});

app.post('/api/send-emails', async (req, res) => {
  if (!transporter) {
    return res.status(400).json({ 
      success: false, 
      message: 'Please configure and test email connection first' 
    });
  }

  const { subject, html, recipients } = req.body;
  const { email, name, replyTo } = req.body.config;

  const results = [];

  try {
    for (const recipient of recipients) {
      try {
        // Generate a unique Message-ID
        const domain = email.split('@')[1];
        const messageId = `${Date.now()}.${Math.random().toString(36).substring(2)}@${domain}`;

        const info = await transporter.sendMail({
          from: {
            name: name,
            address: email
          },
          to: recipient,
          replyTo: replyTo || email,
          subject,
          html,
          // Text version is important for spam prevention
          text: html.replace(/<[^>]*>/g, ''),
          messageId: `<${messageId}>`,
          // Add important headers
          headers: {
            'X-Mailer': 'Custom Mailer 1.0',
            'X-Priority': '3',
            'List-Unsubscribe': `<mailto:${email}?subject=unsubscribe>`,
            'Precedence': 'bulk',
            'X-Auto-Response-Suppress': 'OOF, AutoReply'
          },
          // Add DKIM-style formatting
          dkim: {
            domainName: domain,
            keySelector: 'default',
            privateKey: '...' // Your DKIM private key if available
          },
          // Additional envelope options
          envelope: {
            from: email,
            to: recipient
          },
          // Additional parameters
          encoding: 'utf-8',
          priority: 'normal',
          // Add tracking pixel and unsubscribe link to HTML
          html: `
            ${html}
            <br>
            <p style="font-size: 12px; color: #666;">
              If you wish to unsubscribe, <a href="mailto:${email}?subject=unsubscribe">click here</a>
            </p>
            <img src="https://yourdomain.com/track.png" width="1" height="1" />
          `
        });

        results.push({ 
          email: recipient, 
          status: 'success', 
          message: 'Email sent successfully',
          messageId: info.messageId
        });

        // Add delay between emails (recommended: 1-2 seconds)
        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (error) {
        results.push({ 
          email: recipient, 
          status: 'error', 
          message: error.message 
        });
      }
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error('Send emails error:', error);
    
    if (transporter) {
      await transporter.close();
      transporter = null;
    }

    res.status(500).json({ 
      success: false, 
      message: 'Failed to send emails',
      error: error.toString()
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});