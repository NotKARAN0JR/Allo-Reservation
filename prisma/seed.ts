import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱  Seeding database...");

 
  await prisma.idempotencyKey.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.product.deleteMany();
  await prisma.warehouse.deleteMany();

 
  const mumbai = await prisma.warehouse.create({
    data: { name: "Mumbai Central", location: "Mumbai, Maharashtra" },
  });
  const bangalore = await prisma.warehouse.create({
    data: { name: "Bangalore Hub", location: "Bengaluru, Karnataka" },
  });
  const delhi = await prisma.warehouse.create({
    data: { name: "Delhi North", location: "New Delhi, Delhi" },
  });

  console.log(
    `✅  Created 3 warehouses: ${mumbai.name}, ${bangalore.name}, ${delhi.name}`
  );

 
  const catalogue: Array<{
    name: string;
    description: string;
    price: number;
    stock: Record<string, number>;
  }> = [
    {
      name: "Sony WH-1000XM5",
      description:
        "Industry-leading noise-cancelling wireless headphones with 30-hour battery.",
      price: 29990,
      stock: { mumbai: 5, bangalore: 1, delhi: 3 },
    },
    {
      name: "Apple AirPods Pro (2nd Gen)",
      description:
        "Active noise cancellation, Adaptive Transparency, and Personalized Spatial Audio.",
      price: 24900,
      stock: { mumbai: 2, bangalore: 1, delhi: 0 },
    },
    {
      name: "Kindle Paperwhite (11th Gen)",
      description: '6.8" display, 3-month free Kindle Unlimited, waterproof.',
      price: 13999,
      stock: { mumbai: 8, bangalore: 4, delhi: 1 },
    },
    {
      name: "Samsung Galaxy Tab S9",
      description: "11\" AMOLED display, Snapdragon 8 Gen 2, IP68 rated.",
      price: 72999,
      stock: { mumbai: 1, bangalore: 0, delhi: 2 },
    },
    {
      name: "Logitech MX Master 3S",
      description:
        "Advanced wireless mouse with 8K DPI sensor and MagSpeed scroll.",
      price: 9495,
      stock: { mumbai: 10, bangalore: 6, delhi: 5 },
    },
  ];

  const warehouseMap: Record<string, string> = {
    mumbai: mumbai.id,
    bangalore: bangalore.id,
    delhi: delhi.id,
  };

  for (const item of catalogue) {
    const product = await prisma.product.create({
      data: {
        name: item.name,
        description: item.description,
        price: item.price,
      },
    });

    const stockEntries = Object.entries(item.stock)
      .filter(([, qty]) => qty >= 0) 
      .map(([wh, qty]) => ({
        productId: product.id,
        warehouseId: warehouseMap[wh],
        total: qty,
        reserved: 0,
      }));

    await prisma.stock.createMany({ data: stockEntries });
    console.log(`✅  ${product.name} — stock: ${JSON.stringify(item.stock)}`);
  }

  console.log("\n🎉  Seed complete. Tight stock on several items → easy 409 demo.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
