/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { auditQuotaExceeded } from '@/lib/audit';
import { sendEmail, emailTemplates } from '@/lib/email';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-11-17.clover',
  typescript: true,
});

// Webhook secret from Stripe Dashboard
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

/**
 * Stripe webhook handler
 * IMPORTANT: This must be a raw body request, not JSON parsed
 */
export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'No stripe signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  console.log('[Stripe Webhook] Event received:', event.type, event.id);

  // Handle different event types
  try {
    switch (event.type) {
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object as Stripe.Subscription);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true, type: event.type });
  } catch (error) {
    console.error('[Stripe Webhook] Error processing event:', error);
    return NextResponse.json({ error: 'Event processing failed' }, { status: 500 });
  }
}

/**
 * Handle successful invoice payment
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const tenantId = invoice.metadata?.tenantId;
  if (!tenantId) {
    console.warn('[Stripe] Invoice paid but no tenantId in metadata');
    return;
  }

  console.log(`[Stripe] Invoice paid for tenant ${tenantId}: $${(invoice.amount_paid / 100).toFixed(2)}`);

  try {
    // Create billing event
    await prisma.billingEvent.create({
      data: {
        tenantId,
        type: 'SUBSCRIPTION_RENEWED',
        amount: invoice.amount_paid / 100,
        currency: invoice.currency?.toUpperCase() || 'EUR',
        stripeInvoiceId: invoice.id,
        stripePaid: true,
        stripePaymentIntentId: (invoice as any).payment_intent || null,
        periodStart: new Date(invoice.period_start * 1000),
        periodEnd: new Date(invoice.period_end * 1000),
        paidAt: new Date(),
        description: invoice.description || 'Monthly subscription',
      } as any,
    });

    // Reset monthly usage counter at the start of new billing period
    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        currentUsage: 0,
        status: 'ACTIVE',
        updatedAt: new Date(),
      } as any,
    });

    console.log(`[Stripe] Reset usage counter for tenant ${tenantId}, status: ACTIVE`);
    
    // Send payment confirmation email
    try {
      await sendEmail({
        to: tenant.email,
        ...emailTemplates.paymentSucceeded(tenant, invoice.amount_paid / 100),
      });
    } catch (emailError) {
      console.error('[Stripe] Failed to send payment confirmation email:', emailError);
      // Don't throw - email failure shouldn't break webhook processing
    }
  } catch (error) {
    console.error('[Stripe] Error handling invoice.paid:', error);
    throw error;
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const tenantId = invoice.metadata?.tenantId;
  if (!tenantId) return;

  console.log(`[Stripe] Payment failed for tenant ${tenantId}`);

  try {
    // Create billing event for failed payment
    await prisma.billingEvent.create({
      data: {
        tenantId,
        type: 'PAYMENT_FAILED',
        amount: invoice.amount_due / 100,
        currency: invoice.currency?.toUpperCase() || 'EUR',
        stripeInvoiceId: invoice.id,
        stripePaid: false,
        periodStart: new Date(invoice.period_start * 1000),
        periodEnd: new Date(invoice.period_end * 1000),
        description: `Payment failed: ${invoice.description || 'Monthly subscription'}`,
      } as any,
    });

    // Suspend tenant account after payment failure
    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        status: 'SUSPENDED',
        updatedAt: new Date(),
      } as any,
    });

    console.log(`[Stripe] Tenant ${tenantId} suspended due to payment failure`);

    // Send payment failure notification email
    try {
      await sendEmail({
        to: tenant.email,
        ...emailTemplates.paymentFailed(tenant, invoice.amount_due / 100),
      });
    } catch (emailError) {
      console.error('[Stripe] Failed to send payment failure email:', emailError);
    }
  } catch (error) {
    console.error('[Stripe] Error handling invoice.payment_failed:', error);
    throw error;
  }
}

/**
 * Handle new subscription creation
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const tenantId = subscription.metadata?.tenantId;
  if (!tenantId) return;

  console.log(`[Stripe] Subscription created for tenant ${tenantId}`);

  try {
    // Determine plan based on price ID or metadata
    const plan = determinePlanFromSubscription(subscription);
    
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        status: 'ACTIVE',
        plan,
        subscriptionStartedAt: new Date(subscription.created * 1000),
        trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        monthlyQuota: getQuotaForPlan(plan),
        updatedAt: new Date(),
      } as any,
    });

    // Create billing event
    await prisma.billingEvent.create({
      data: {
        tenantId,
        type: subscription.trial_end ? 'TRIAL_STARTED' : 'SUBSCRIPTION_CREATED',
        amount: 0, // First payment handled by invoice.paid
        currency: 'EUR',
        periodStart: new Date((subscription as any).current_period_start * 1000),
        periodEnd: new Date((subscription as any).current_period_end * 1000),
        description: `Subscription created: ${plan} plan`,
      } as any,
    });

    console.log(`[Stripe] Tenant ${tenantId} subscribed to ${plan} plan`);
  } catch (error) {
    console.error('[Stripe] Error handling subscription.created:', error);
    throw error;
  }
}

/**
 * Handle subscription update (upgrade/downgrade)
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const tenantId = subscription.metadata?.tenantId;
  if (!tenantId) return;

  console.log(`[Stripe] Subscription updated for tenant ${tenantId}`);

  try {
    const oldTenant = await prisma.tenant.findUnique({ where: { id: tenantId } }) as any;
    const newPlan = determinePlanFromSubscription(subscription);
    const oldPlan = oldTenant?.plan;

    if (oldPlan !== newPlan) {
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          plan: newPlan,
          monthlyQuota: getQuotaForPlan(newPlan),
          updatedAt: new Date(),
        } as any,
      });

      // Create billing event for plan change
      await prisma.billingEvent.create({
        data: {
          tenantId,
          type: getQuotaForPlan(newPlan) > getQuotaForPlan(oldPlan) ? 'PLAN_UPGRADED' : 'PLAN_DOWNGRADED',
          amount: 0, // Prorated amounts handled by invoice
          currency: 'EUR',
          periodStart: new Date((subscription as any).current_period_start * 1000),
          periodEnd: new Date((subscription as any).current_period_end * 1000),
          description: `Plan changed from ${oldPlan} to ${newPlan}`,
          metadata: { oldPlan, newPlan },
        } as any,
      });

      console.log(`[Stripe] Tenant ${tenantId} changed plan from ${oldPlan} to ${newPlan}`);
    }
  } catch (error) {
    console.error('[Stripe] Error handling subscription.updated:', error);
    throw error;
  }
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const tenantId = subscription.metadata?.tenantId;
  if (!tenantId) return;

  console.log(`[Stripe] Subscription cancelled for tenant ${tenantId}`);

  try {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        status: subscription.cancel_at_period_end ? 'CANCELLED' : 'CHURNED',
        updatedAt: new Date(),
      } as any,
    });

    // Create billing event
    await prisma.billingEvent.create({
      data: {
        tenantId,
        type: 'SUBSCRIPTION_CANCELLED',
        amount: 0,
        currency: 'EUR',
        periodStart: new Date(),
        periodEnd: new Date(),
        description: 'Subscription cancelled',
      } as any,
    });

    console.log(`[Stripe] Tenant ${tenantId} subscription cancelled`);
  } catch (error) {
    console.error('[Stripe] Error handling subscription.deleted:', error);
    throw error;
  }
}

/**
 * Handle trial ending soon notification
 */
async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  const tenantId = subscription.metadata?.tenantId;
  if (!tenantId) return;

  console.log(`[Stripe] Trial ending soon for tenant ${tenantId}`);
  
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } }) as any;
    if (!tenant) return;
    
    const trialEndDate = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;
    const daysRemaining = trialEndDate ? Math.ceil((trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 3;
    
    // Send trial ending notification email
    await sendEmail({
      to: tenant.email,
      ...emailTemplates.trialEndingSoon(tenant, daysRemaining),
    });
  } catch (error) {
    console.error('[Stripe] Error sending trial ending email:', error);
  }
}

/**
 * Handle successful payment intent
 */
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log(`[Stripe] Payment succeeded: ${paymentIntent.id}, amount: ${paymentIntent.amount / 100} ${paymentIntent.currency}`);
  
  // This is usually handled by invoice.paid for subscriptions
  // Can be used for one-time payments if needed
}

/**
 * Helper: Determine plan from Stripe subscription
 */
function determinePlanFromSubscription(subscription: Stripe.Subscription): string {
  // Get the first price item
  const priceId = subscription.items.data[0]?.price.id;
  const priceMeta = subscription.items.data[0]?.price.metadata;
  
  // Check metadata first
  if (priceMeta?.plan) {
    return priceMeta.plan.toUpperCase();
  }
  
  // Map price IDs to plans (you need to configure these in Stripe)
  const priceIdToPlan: Record<string, string> = {
    'price_1QYH72HMNZWvMcNZ0p8Nf3D2': 'STARTER',
    'price_1QYH73HMNZWvMcNZZKFz7p7L': 'PRO',
    'price_1QYH74HMNZWvMcNZBMrjCmek': 'BUSINESS',
    'price_1QYH75HMNZWvMcNZEywFQBPR': 'ENTERPRISE',
    // Add your actual Stripe price IDs here
  };
  
  return priceIdToPlan[priceId || ''] || 'STARTER';
}

/**
 * Helper: Get quota for a given plan
 */
function getQuotaForPlan(plan: string): number {
  const quotas: Record<string, number> = {
    FREE: 1000,
    STARTER: 10000,
    PRO: 100000,
    BUSINESS: 500000,
    ENTERPRISE: 999999999,
  };
  
  return quotas[plan.toUpperCase()] || 10000;
}
