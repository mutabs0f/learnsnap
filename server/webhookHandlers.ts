import { getStripeSync, getUncachableStripeClient } from './stripeClient';
import { db } from './db';
import { users } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);

    const stripe = await getUncachableStripeClient();
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as any;
          if (session.mode === 'subscription' && session.customer) {
            const customerId = session.customer as string;
            const subscriptionId = session.subscription as string;
            
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const priceId = subscription.items.data[0]?.price.id;
            const productId = subscription.items.data[0]?.price.product as string;
            const product = await stripe.products.retrieve(productId);
            const tier = (product.metadata?.tier as string) || 'basic';

            await db.update(users)
              .set({
                stripeSubscriptionId: subscriptionId,
                subscriptionTier: tier,
                subscriptionStatus: 'active',
              })
              .where(eq(users.stripeCustomerId, customerId));

            console.log(`Subscription activated for customer ${customerId}: ${tier}`);
          }
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object as any;
          const customerId = subscription.customer as string;
          const status = subscription.status;
          
          let subscriptionStatus = 'active';
          if (status === 'canceled' || status === 'unpaid') {
            subscriptionStatus = 'cancelled';
          } else if (status === 'past_due') {
            subscriptionStatus = 'past_due';
          }

          await db.update(users)
            .set({ subscriptionStatus })
            .where(eq(users.stripeCustomerId, customerId));

          console.log(`Subscription updated for customer ${customerId}: ${status}`);
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as any;
          const customerId = subscription.customer as string;

          await db.update(users)
            .set({
              subscriptionTier: 'free',
              subscriptionStatus: 'cancelled',
              stripeSubscriptionId: null,
            })
            .where(eq(users.stripeCustomerId, customerId));

          console.log(`Subscription cancelled for customer ${customerId}`);
          break;
        }
      }
    } catch (err) {
      console.error('Error processing webhook event:', err);
    }
  }
}
