// app/api/products/seed-multiple/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();
const TOTAL_PRODUCTS = 4000;
const BATCH_SIZE = 100;

export const POST = async (_req: NextRequest) => {
  try {
    let productsToCreate = [];

    for (let i = 0; i < TOTAL_PRODUCTS; i++) {
      const randomSold = faker.number.int({ min: 1, max: 50 });
      const randomRoyalty = faker.number.int({ min: 5, max: 30 });
      const usdPrice = parseFloat(faker.number.float({ 
        min: 5, 
        max: 20, 
        fractionDigits: 2 
      }).toFixed(2));
      const inrPrice = parseFloat((usdPrice * 88).toFixed(2));
      const totalRoyaltyUSD = parseFloat((usdPrice * randomSold * (randomRoyalty / 100)).toFixed(6));
      const totalRoyaltyINR = parseFloat((totalRoyaltyUSD * 88).toFixed(6));

      const product = {
        productId: faker.string.uuid(),
        shopifyId: faker.string.uuid(),
        title: `${faker.commerce.productName()} ${i + 1}`,
        image: faker.image.urlLoremFlickr({ category: 'sports' }),
        status: faker.helpers.arrayElement(['active', 'archived']),
        inArchive: faker.datatype.boolean(),
        designerId: "RA672048618",
        royality: randomRoyalty,
        shop: "royality-demo.myshopify.com",
        totalSold: randomSold,
        createdAt: new Date(),
        updatedAt: new Date(),
        price: {
          amount: usdPrice,
          currency: "USD",
          storeCurrency: "INR",
          storeAmount: inrPrice,
        },
        totalRoyaltyEarned: {
          amount: totalRoyaltyINR,
          currency: "INR",
          usdAmount: totalRoyaltyUSD,
        },
        expiry: new Date(new Date().setMonth(new Date().getMonth() + 2)),

      };

      productsToCreate.push(product);

      // Insert in batches
      if (productsToCreate.length === BATCH_SIZE) {
        await prisma.productRoyalty.createMany({
          data: productsToCreate,
        });
        console.log(`Inserted ${productsToCreate.length} products (batch ${Math.floor(i / BATCH_SIZE) + 1})`);
        productsToCreate = [];
      }
    }

    // Insert any remaining products
    if (productsToCreate.length > 0) {
      await prisma.productRoyalty.createMany({
        data: productsToCreate,
      });
      console.log(`Inserted final batch of ${productsToCreate.length} products`);
    }

    return NextResponse.json({ success: true, totalCreated: TOTAL_PRODUCTS });
  } catch (error: any) {
    console.error("Error seeding products:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
};