export default {
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  planPriceIds: {
    HOBBY: process.env.STRIPE_HOBBY_PRICE_ID || 'price_hobby',
    PRO: process.env.STRIPE_PRO_PRICE_ID || 'price_pro',
    ENTERPRISE: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise',
  },
};
