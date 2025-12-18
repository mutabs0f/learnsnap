import { getUncachableStripeClient } from '../server/stripeClient';

async function seedProducts() {
  const stripe = await getUncachableStripeClient();

  console.log('Creating subscription products...');

  const products = await stripe.products.search({ query: "name:'LearnSnap'" });
  if (products.data.length > 0) {
    console.log('Products already exist, skipping seed');
    return;
  }

  const basicProduct = await stripe.products.create({
    name: 'LearnSnap أساسي',
    description: 'خطة أساسية - 5 فصول شهرياً، طفل واحد',
    metadata: {
      tier: 'basic',
      monthlyChapters: '5',
      maxChildren: '1',
    },
  });

  await stripe.prices.create({
    product: basicProduct.id,
    unit_amount: 2900,
    currency: 'sar',
    recurring: { interval: 'month' },
  });

  console.log('Created Basic product:', basicProduct.id);

  const proProduct = await stripe.products.create({
    name: 'LearnSnap برو',
    description: 'خطة احترافية - 20 فصل شهرياً، 3 أطفال',
    metadata: {
      tier: 'pro',
      monthlyChapters: '20',
      maxChildren: '3',
    },
  });

  await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 7900,
    currency: 'sar',
    recurring: { interval: 'month' },
  });

  console.log('Created Pro product:', proProduct.id);

  const familyProduct = await stripe.products.create({
    name: 'LearnSnap عائلي',
    description: 'خطة عائلية - فصول غير محدودة، 10 أطفال',
    metadata: {
      tier: 'family',
      monthlyChapters: 'unlimited',
      maxChildren: '10',
    },
  });

  await stripe.prices.create({
    product: familyProduct.id,
    unit_amount: 14900,
    currency: 'sar',
    recurring: { interval: 'month' },
  });

  console.log('Created Family product:', familyProduct.id);
  console.log('Seed complete!');
}

seedProducts().catch(console.error);
