import { prisma } from '../config/prisma.js';

const SETTINGS_ID = 'default';

// Configuración de la tienda como registro único (singleton).
export const storeSettingsService = {
  // Devuelve la configuración; si no existe, la crea con valores por defecto.
  async get() {
    let settings = await prisma.storeSettings.findUnique({ where: { id: SETTINGS_ID } });
    if (!settings) {
      settings = await prisma.storeSettings.create({ data: { id: SETTINGS_ID } });
    }
    return settings;
  },

  async update(data) {
    // upsert: garantiza que siempre exista el registro
    return prisma.storeSettings.upsert({
      where: { id: SETTINGS_ID },
      update: data,
      create: { id: SETTINGS_ID, ...data },
    });
  },
};
