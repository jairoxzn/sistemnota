import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { catalogService } from '../services/catalog.service.js';
import { storeSettingsService } from '../services/storeSettings.service.js';
import { prisma } from '../config/prisma.js';

// Rutas PÚBLICAS (sin autenticación). Se usan para el catálogo que se
// comparte con clientes y para mostrar la marca en la pantalla de login.
const router = Router();

// Imagen de un producto servida como archivo binario (no en el JSON de las
// listas). El navegador la cachea; se invalida con ?v=<updatedAt> en la URL.
router.get(
  '/product-image/:id',
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      select: { image: true },
    });
    const dataUrl = product?.image;
    const match = dataUrl && /^data:(image\/[\w+.-]+);base64,(.+)$/s.exec(dataUrl);
    if (!match) return res.status(404).end();

    const buffer = Buffer.from(match[2], 'base64');
    res.set('Content-Type', match[1]);
    // Cache larga + immutable: el cambio de imagen se refleja al cambiar ?v=
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(buffer);
  })
);

// Branding: datos mínimos de la tienda para personalizar el login.
router.get(
  '/branding',
  asyncHandler(async (_req, res) => {
    const s = await storeSettingsService.get();
    res.json({
      success: true,
      branding: {
        name: s.name,
        logo: s.logo,
        address: s.address,
        phone: s.phone,
        email: s.email,
      },
    });
  })
);

router.get(
  '/catalog',
  asyncHandler(async (req, res) => {
    const data = await catalogService.get({
      search: req.query.search,
      categoryId: req.query.categoryId,
    });
    res.json({ success: true, ...data });
  })
);

export default router;
