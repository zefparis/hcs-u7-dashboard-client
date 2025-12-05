/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

/**
 * Send email via Resend
 */
export async function sendEmail(options: EmailOptions) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not configured, skipping email send');
    return null;
  }

  try {
    const result = await resend.emails.send({
      from: 'HCS-U7 Dashboard <notifications@hcs-u7.online>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo || 'contact@ia-solution.fr',
    });

    console.log('[Email] Sent successfully:', result);
    return result;
  } catch (error) {
    console.error('[Email] Failed to send:', error);
    throw error;
  }
}

/**
 * Email template wrapper
 */
function emailLayout(content: string, footer = true): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px 20px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background: #667eea;
      color: white !important;
      text-decoration: none;
      border-radius: 6px;
      margin-top: 20px;
      font-weight: 500;
    }
    .button:hover {
      background: #5a67d8;
    }
    .warning {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px;
      margin: 20px 0;
    }
    .danger {
      background: #fee2e2;
      border-left: 4px solid #ef4444;
      padding: 12px;
      margin: 20px 0;
    }
    .success {
      background: #d1fae5;
      border-left: 4px solid #10b981;
      padding: 12px;
      margin: 20px 0;
    }
    .footer {
      background: #f8f8f8;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    .stats {
      background: #f8f8f8;
      border-radius: 6px;
      padding: 15px;
      margin: 20px 0;
    }
    .stat-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .stat-item:last-child {
      border-bottom: none;
    }
    .stat-label {
      color: #6b7280;
    }
    .stat-value {
      font-weight: 600;
      color: #111827;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛡️ HCS-U7 Dashboard</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    ${footer ? `
    <div class="footer">
      <p>© 2025 HCS-U7 by IA SOLUTION</p>
      <p>
        <a href="https://www.hcs-u7.online">Dashboard</a> •
        <a href="https://www.hcs-u7.com">Documentation</a> •
        <a href="mailto:contact@ia-solution.fr">Support</a>
      </p>
      <p style="margin-top: 15px; font-size: 11px; color: #999;">
        Patent Pending FR2514274 | Advanced Cognitive Firewall Technology
      </p>
    </div>
    ` : ''}
  </div>
</body>
</html>`;
}

/**
 * Email Templates
 */
export const emailTemplates = {
  /**
   * Quota warning email
   */
  quotaWarning: (tenant: any, percentage: number) => ({
    subject: `⚠️ API Quota Alert: ${percentage}% Used`,
    html: emailLayout(`
      <h2>API Quota Warning</h2>
      <p>Hello ${tenant.fullName || tenant.email},</p>
      
      <div class="warning">
        <strong>⚠️ Your API usage has reached ${percentage}% of your monthly quota.</strong>
      </div>
      
      <div class="stats">
        <div class="stat-item">
          <span class="stat-label">Current Usage</span>
          <span class="stat-value">${tenant.currentUsage?.toLocaleString() || 0} requests</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Monthly Quota</span>
          <span class="stat-value">${tenant.monthlyQuota?.toLocaleString() || 0} requests</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Remaining</span>
          <span class="stat-value">${((tenant.monthlyQuota || 0) - (tenant.currentUsage || 0)).toLocaleString()} requests</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Current Plan</span>
          <span class="stat-value">${tenant.plan || 'STARTER'}</span>
        </div>
      </div>
      
      <p>To avoid service interruption, consider upgrading your plan to increase your monthly quota.</p>
      
      <center>
        <a href="https://www.hcs-u7.online/dashboard/billing" class="button">
          Upgrade Plan
        </a>
      </center>
    `),
    text: `Your HCS-U7 API usage has reached ${percentage}% of your monthly quota. Current: ${tenant.currentUsage} / ${tenant.monthlyQuota} requests.`,
  }),

  /**
   * Quota exceeded email
   */
  quotaExceeded: (tenant: any) => ({
    subject: '🚨 API Quota Exceeded - Service Suspended',
    html: emailLayout(`
      <h2>Quota Exceeded</h2>
      <p>Hello ${tenant.fullName || tenant.email},</p>
      
      <div class="danger">
        <strong>🚨 Your API quota has been exceeded and your service has been temporarily suspended.</strong>
      </div>
      
      <div class="stats">
        <div class="stat-item">
          <span class="stat-label">Usage</span>
          <span class="stat-value" style="color: #ef4444;">${tenant.currentUsage?.toLocaleString() || 0} requests</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Quota</span>
          <span class="stat-value">${tenant.monthlyQuota?.toLocaleString() || 0} requests</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Overage</span>
          <span class="stat-value" style="color: #ef4444;">+${((tenant.currentUsage || 0) - (tenant.monthlyQuota || 0)).toLocaleString()} requests</span>
        </div>
      </div>
      
      <p><strong>What happens now?</strong></p>
      <ul>
        <li>API requests will return 429 (Too Many Requests) errors</li>
        <li>Your service will remain suspended until the next billing cycle</li>
        <li>Or you can upgrade your plan immediately to restore service</li>
      </ul>
      
      <center>
        <a href="https://www.hcs-u7.online/dashboard/billing" class="button" style="background: #ef4444;">
          Upgrade Now to Restore Service
        </a>
      </center>
    `),
    text: `Your HCS-U7 API quota has been exceeded. Usage: ${tenant.currentUsage} / ${tenant.monthlyQuota} requests. Service suspended.`,
  }),

  /**
   * Payment failed email
   */
  paymentFailed: (tenant: any, amount: number) => ({
    subject: '🚨 Payment Failed - Action Required',
    html: emailLayout(`
      <h2>Payment Failed</h2>
      <p>Hello ${tenant.fullName || tenant.email},</p>
      
      <div class="danger">
        <strong>🚨 We were unable to process your payment of €${amount.toFixed(2)}.</strong>
      </div>
      
      <p>Your HCS-U7 service has been suspended until payment is resolved. Please update your payment method as soon as possible to avoid service interruption.</p>
      
      <div class="stats">
        <div class="stat-item">
          <span class="stat-label">Amount Due</span>
          <span class="stat-value">€${amount.toFixed(2)}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Plan</span>
          <span class="stat-value">${tenant.plan || 'STARTER'}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Status</span>
          <span class="stat-value" style="color: #ef4444;">Suspended</span>
        </div>
      </div>
      
      <center>
        <a href="https://www.hcs-u7.online/dashboard/billing" class="button" style="background: #ef4444;">
          Update Payment Method
        </a>
      </center>
      
      <p style="margin-top: 20px; font-size: 14px; color: #666;">
        If you believe this is an error or need assistance, please contact our support team at 
        <a href="mailto:contact@ia-solution.fr">contact@ia-solution.fr</a>
      </p>
    `),
    text: `Payment failed for your HCS-U7 subscription. Amount: €${amount.toFixed(2)}. Please update your payment method.`,
  }),

  /**
   * Payment succeeded email
   */
  paymentSucceeded: (tenant: any, amount: number) => ({
    subject: '✅ Payment Received - Thank You!',
    html: emailLayout(`
      <h2>Payment Successful</h2>
      <p>Hello ${tenant.fullName || tenant.email},</p>
      
      <div class="success">
        <strong>✅ We've successfully received your payment of €${amount.toFixed(2)}.</strong>
      </div>
      
      <div class="stats">
        <div class="stat-item">
          <span class="stat-label">Amount Paid</span>
          <span class="stat-value">€${amount.toFixed(2)}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Plan</span>
          <span class="stat-value">${tenant.plan || 'STARTER'}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Monthly Quota</span>
          <span class="stat-value">${tenant.monthlyQuota?.toLocaleString() || '10,000'} requests</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Usage Reset</span>
          <span class="stat-value">0 / ${tenant.monthlyQuota?.toLocaleString() || '10,000'}</span>
        </div>
      </div>
      
      <p>Your monthly usage counter has been reset and your service is fully active.</p>
      
      <center>
        <a href="https://www.hcs-u7.online/dashboard/overview" class="button">
          View Dashboard
        </a>
      </center>
    `),
    text: `Payment received for your HCS-U7 subscription. Amount: €${amount.toFixed(2)}. Thank you!`,
  }),

  /**
   * API key rotated email
   */
  keyRotated: (tenant: any, keyType: 'test' | 'live') => ({
    subject: `🔑 API Key Rotated (${keyType.toUpperCase()})`,
    html: emailLayout(`
      <h2>API Key Rotated</h2>
      <p>Hello ${tenant.fullName || tenant.email},</p>
      
      <div class="warning">
        <strong>🔑 Your ${keyType.toUpperCase()} API key has been rotated.</strong>
      </div>
      
      <p>The old key has been deactivated and will no longer work. A new key has been generated and is available in your dashboard.</p>
      
      <p><strong>Important:</strong></p>
      <ul>
        <li>Update your application with the new key immediately</li>
        <li>The old key is permanently deactivated</li>
        <li>This action was initiated from IP: ${tenant.lastIp || 'Unknown'}</li>
      </ul>
      
      <center>
        <a href="https://www.hcs-u7.online/dashboard/api-keys" class="button">
          View New Key
        </a>
      </center>
      
      <p style="margin-top: 20px; font-size: 14px; color: #666;">
        If you did not initiate this action, please contact support immediately at 
        <a href="mailto:contact@ia-solution.fr">contact@ia-solution.fr</a>
      </p>
    `),
    text: `Your ${keyType.toUpperCase()} API key has been rotated. Update your application with the new key.`,
  }),

  /**
   * Trial ending soon email
   */
  trialEndingSoon: (tenant: any, daysRemaining: number) => ({
    subject: `⏰ Trial Ending in ${daysRemaining} Days`,
    html: emailLayout(`
      <h2>Your Trial is Ending Soon</h2>
      <p>Hello ${tenant.fullName || tenant.email},</p>
      
      <div class="warning">
        <strong>⏰ Your HCS-U7 trial period will end in ${daysRemaining} days.</strong>
      </div>
      
      <p>To continue using HCS-U7 without interruption, please choose a plan that fits your needs:</p>
      
      <div class="stats">
        <div class="stat-item">
          <span class="stat-label">Starter Plan</span>
          <span class="stat-value">€29/month - 10K requests</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Pro Plan</span>
          <span class="stat-value">€99/month - 100K requests</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Business Plan</span>
          <span class="stat-value">€299/month - 500K requests</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Enterprise</span>
          <span class="stat-value">Custom pricing</span>
        </div>
      </div>
      
      <center>
        <a href="https://www.hcs-u7.online/dashboard/billing" class="button">
          Choose Your Plan
        </a>
      </center>
      
      <p style="margin-top: 20px;">
        <strong>Why upgrade?</strong>
      </p>
      <ul>
        <li>🛡️ Enterprise-grade cognitive firewall protection</li>
        <li>🤖 AI-resistant authentication system</li>
        <li>📊 Detailed analytics and usage reports</li>
        <li>🔐 PSD2 SCA compliant</li>
        <li>⚡ 99.9% uptime SLA</li>
      </ul>
    `),
    text: `Your HCS-U7 trial will end in ${daysRemaining} days. Choose a plan to continue.`,
  }),

  /**
   * Welcome email for new users
   */
  welcome: (tenant: any, apiKey?: string) => ({
    subject: '🎉 Welcome to HCS-U7 Dashboard',
    html: emailLayout(`
      <h2>Welcome to HCS-U7!</h2>
      <p>Hello ${tenant.fullName || tenant.email},</p>
      
      <div class="success">
        <strong>🎉 Your HCS-U7 account has been successfully created!</strong>
      </div>
      
      <p>You now have access to the most advanced cognitive firewall technology for protecting your applications against AI-driven attacks.</p>
      
      ${apiKey ? `
      <div class="stats">
        <div class="stat-item">
          <span class="stat-label">Your API Key</span>
          <span class="stat-value" style="font-family: monospace; font-size: 12px;">${apiKey}</span>
        </div>
      </div>
      
      <p style="color: #ef4444;">
        <strong>⚠️ Important:</strong> Save your API key securely. For security reasons, it won't be displayed again.
      </p>
      ` : ''}
      
      <p><strong>Getting Started:</strong></p>
      <ol>
        <li>Access your dashboard at <a href="https://www.hcs-u7.online">www.hcs-u7.online</a></li>
        <li>Generate API keys in the API Keys section</li>
        <li>Integrate HCS-U7 using our documentation</li>
        <li>Monitor usage and security in real-time</li>
      </ol>
      
      <center>
        <a href="https://www.hcs-u7.online/dashboard" class="button">
          Access Dashboard
        </a>
      </center>
      
      <p style="margin-top: 20px;">
        Need help? Check out our <a href="https://www.hcs-u7.com">documentation</a> or contact support at 
        <a href="mailto:contact@ia-solution.fr">contact@ia-solution.fr</a>
      </p>
    `),
    text: `Welcome to HCS-U7! Your account has been created. ${apiKey ? `Your API key: ${apiKey}` : ''}`,
  }),
};
