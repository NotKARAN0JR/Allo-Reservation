import { findAllProductsWithAvailability } from "@/lib/repositories/product.repository";
import { ProductCard } from "@/components/ProductCard";

export const dynamic = "force-dynamic"; // always fresh stock data

export default async function ProductsPage() {
  const products = await findAllProductsWithAvailability();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
        <p className="text-muted-foreground mt-1">
          Select a warehouse to reserve stock for checkout.
        </p>
      </div>

      {products.length === 0 ? (
        <p className="text-muted-foreground">
          No products found. Run <code className="font-mono text-sm">npm run db:seed</code> to seed the database.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
