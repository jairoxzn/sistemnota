// Datos de ejemplo para pruebas.
// Ejecutar con: npm run seed
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Sembrando datos de ejemplo...');

  // ─── Usuarios ─────────────────────────────────────────────────
  const adminPass = await bcrypt.hash('Admin123!', 10);
  const sellerPass = await bcrypt.hash('Vendedor123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@sistemnota.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@sistemnota.com',
      password: adminPass,
      role: 'ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { email: 'vendedor@sistemnota.com' },
    update: {},
    create: {
      name: 'Juan Vendedor',
      email: 'vendedor@sistemnota.com',
      password: sellerPass,
      role: 'SELLER',
    },
  });
  console.log('✔ Usuarios creados (admin / vendedor)');

  // ─── Categorías ───────────────────────────────────────────────
  const categoriesData = ['Bebidas', 'Abarrotes', 'Limpieza', 'Snacks', 'Lácteos'];
  const categories = {};
  for (const name of categoriesData) {
    const c = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    categories[name] = c;
  }
  console.log('✔ Categorías creadas');

  // ─── Productos ────────────────────────────────────────────────
  const products = [
    { code: 'BEB-001', name: 'Agua mineral 625ml', price: 1.5, stock: 120, category: 'Bebidas', description: 'Botella de agua sin gas' },
    { code: 'BEB-002', name: 'Gaseosa cola 500ml', price: 2.5, stock: 90, category: 'Bebidas', description: 'Bebida gaseosa sabor cola' },
    { code: 'BEB-003', name: 'Jugo de naranja 1L', price: 4.9, stock: 40, category: 'Bebidas', description: 'Jugo natural pasteurizado' },
    { code: 'ABA-001', name: 'Arroz extra 1kg', price: 3.8, stock: 200, category: 'Abarrotes', description: 'Arroz grano largo' },
    { code: 'ABA-002', name: 'Azúcar rubia 1kg', price: 3.2, stock: 150, category: 'Abarrotes', description: 'Azúcar de caña' },
    { code: 'ABA-003', name: 'Aceite vegetal 1L', price: 8.5, stock: 60, category: 'Abarrotes', description: 'Aceite para cocinar' },
    { code: 'ABA-004', name: 'Fideos spaghetti 500g', price: 2.9, stock: 110, category: 'Abarrotes', description: 'Pasta de trigo' },
    { code: 'LIM-001', name: 'Detergente 900g', price: 7.9, stock: 45, category: 'Limpieza', description: 'Detergente en polvo' },
    { code: 'LIM-002', name: 'Lejía 1L', price: 3.5, stock: 70, category: 'Limpieza', description: 'Desinfectante concentrado' },
    { code: 'SNK-001', name: 'Galletas surtidas', price: 1.2, stock: 300, category: 'Snacks', description: 'Paquete individual' },
    { code: 'SNK-002', name: 'Papas fritas 120g', price: 3.9, stock: 80, category: 'Snacks', description: 'Snack de papa' },
    { code: 'LAC-001', name: 'Leche evaporada 400g', price: 3.6, stock: 130, category: 'Lácteos', description: 'Leche entera en lata' },
    { code: 'LAC-002', name: 'Yogurt fresa 1L', price: 5.5, stock: 35, category: 'Lácteos', description: 'Yogurt bebible' },
    { code: 'LAC-003', name: 'Queso fresco 500g', price: 9.9, stock: 25, category: 'Lácteos', description: 'Queso fresco artesanal' },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { code: p.code },
      update: {},
      create: {
        code: p.code,
        name: p.name,
        description: p.description,
        price: p.price,
        stock: p.stock,
        categoryId: categories[p.category].id,
      },
    });
  }
  console.log(`✔ ${products.length} productos creados`);

  // ─── Clientes ─────────────────────────────────────────────────
  const customers = [
    { fullName: 'Cliente Varios', documentId: '00000000', phone: '', email: '', address: '' },
    { fullName: 'María Fernández', documentId: '45871236', phone: '987654321', email: 'maria@example.com', address: 'Calle Los Olivos 456' },
    { fullName: 'Carlos Ramírez', documentId: '10254789', phone: '912345678', email: 'carlos@example.com', address: 'Jr. Las Flores 789' },
    { fullName: 'Distribuidora El Sol E.I.R.L.', documentId: '20512345678', phone: '015551234', email: 'ventas@elsol.com', address: 'Av. Industrial 1200' },
  ];

  for (const c of customers) {
    await prisma.customer.upsert({
      where: { documentId: c.documentId },
      update: {},
      create: c,
    });
  }
  console.log(`✔ ${customers.length} clientes creados`);

  // ─── Configuración de la tienda ───────────────────────────────
  await prisma.storeSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      name: process.env.STORE_NAME || 'Mi Tienda S.A.C.',
      ruc: process.env.STORE_RUC || '20123456789',
      address: process.env.STORE_ADDRESS || 'Av. Principal 123, Lima',
      phone: process.env.STORE_PHONE || '(01) 555-1234',
      email: process.env.STORE_EMAIL || 'ventas@mitienda.com',
      currency: process.env.CURRENCY || 'S/',
      thankYouMessage: '¡Gracias por su compra!',
      lowStockThreshold: 10,
    },
  });
  console.log('✔ Configuración de la tienda creada');

  // ─── Movimientos de inventario iniciales (entrada) ────────────
  const movementsCount = await prisma.stockMovement.count();
  if (movementsCount === 0) {
    const allProducts = await prisma.product.findMany();
    await prisma.stockMovement.createMany({
      data: allProducts.map((p) => ({
        type: 'ENTRY',
        quantity: p.stock,
        previousStock: 0,
        newStock: p.stock,
        reason: 'Carga inicial de inventario',
        productId: p.id,
        userId: admin.id,
      })),
    });
    console.log(`✔ ${allProducts.length} movimientos de inventario iniciales`);
  }

  // ─── Venta de ejemplo ─────────────────────────────────────────
  const existingSales = await prisma.sale.count();
  if (existingSales === 0) {
    const water = await prisma.product.findUnique({ where: { code: 'BEB-001' } });
    const rice = await prisma.product.findUnique({ where: { code: 'ABA-001' } });
    const maria = await prisma.customer.findUnique({ where: { documentId: '45871236' } });

    const line1 = { product: water, qty: 3 };
    const line2 = { product: rice, qty: 2 };
    const subtotal = Number(water.price) * line1.qty + Number(rice.price) * line2.qty;

    await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          customerId: maria.id,
          userId: admin.id,
          subtotal,
          discount: 0,
          total: subtotal,
          paymentMethod: 'CASH',
          details: {
            create: [
              {
                productId: water.id,
                productName: water.name,
                productCode: water.code,
                quantity: line1.qty,
                unitPrice: water.price,
                subtotal: Number(water.price) * line1.qty,
              },
              {
                productId: rice.id,
                productName: rice.name,
                productCode: rice.code,
                quantity: line2.qty,
                unitPrice: rice.price,
                subtotal: Number(rice.price) * line2.qty,
              },
            ],
          },
        },
      });
      await tx.product.update({ where: { id: water.id }, data: { stock: { decrement: line1.qty } } });
      await tx.product.update({ where: { id: rice.id }, data: { stock: { decrement: line2.qty } } });
      return sale;
    });
    console.log('✔ Venta de ejemplo creada');
  }

  console.log('✅ Seed completado.');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
