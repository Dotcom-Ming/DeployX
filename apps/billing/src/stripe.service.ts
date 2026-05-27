import Stripe from 'stripe';

export class StripeService {
  private readonly stripe: Stripe;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY || '';
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2024-04-10' as any,
    });
  }

  async createCustomer(
    name: string,
    email?: string,
  ): Promise<Stripe.Customer> {
    console.log(`Creating Stripe customer: ${name}`);

    const customer = await this.stripe.customers.create({
      name,
      email: email || undefined,
      metadata: {
        platform: 'deployx',
      },
    });

    return customer;
  }

  async createSubscription(
    customerId: string,
    priceId: string,
  ): Promise<Stripe.Subscription> {
    console.log(`Creating Stripe subscription for customer ${customerId}`);

    const subscription = await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    return subscription;
  }

  async cancelSubscription(
    subscriptionId: string,
  ): Promise<Stripe.Subscription> {
    console.log(`Canceling Stripe subscription ${subscriptionId}`);

    const subscription = await this.stripe.subscriptions.update(
      subscriptionId,
      {
        cancel_at_period_end: true,
      },
    );

    return subscription;
  }

  async updateSubscription(
    subscriptionId: string,
    newPriceId: string,
  ): Promise<Stripe.Subscription> {
    console.log(`Updating Stripe subscription ${subscriptionId} to price ${newPriceId}`);

    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);

    const updatedSubscription = await this.stripe.subscriptions.update(
      subscriptionId,
      {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: 'create_prorations',
      },
    );

    return updatedSubscription;
  }

  async createCheckoutSession(
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
  ): Promise<Stripe.Checkout.Session> {
    console.log(`Creating checkout session for customer ${customerId}`);

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return session;
  }

  constructWebhookEvent(
    payload: string | Buffer,
    signature: string,
  ): Stripe.Event {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );
  }
}
