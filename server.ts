import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // ==========================================
  // API ROUTES (Mapeamento RESTful para Supabase)
  // ==========================================

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // 1. Listar Casas
  app.get('/api/houses', (req, res) => {
    const houses = db.getHouses();
    res.json(houses);
  });

  // 2. Obter Dados Relacionais Completos de uma Casa
  app.get('/api/houses/:houseId/data', (req, res) => {
    const { houseId } = req.params;
    const data = db.getHouseData(houseId);
    if (!data) {
      return res.status(404).json({ error: 'Casa não encontrada' });
    }
    res.json(data);
  });

  // 3. Cadastrar Produto
  app.post('/api/houses/:houseId/products', (req, res) => {
    try {
      const { houseId } = req.params;
      const product = db.addProduct(houseId, req.body);
      res.status(201).json(product);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // 4. Atualizar Produto
  app.put('/api/houses/:houseId/products/:productId', (req, res) => {
    try {
      const { houseId, productId } = req.params;
      const product = db.updateProduct(houseId, productId, req.body);
      if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
      res.json(product);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // 5. Excluir Produto
  app.delete('/api/houses/:houseId/products/:productId', (req, res) => {
    const { houseId, productId } = req.params;
    const success = db.deleteProduct(houseId, productId);
    if (!success) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json({ success: true });
  });

  // 6. Registrar Consumo
  app.post('/api/houses/:houseId/consumptions', (req, res) => {
    try {
      const { houseId } = req.params;
      const { productId, quantity, date, memberId, notes } = req.body;
      const result = db.recordConsumption(houseId, productId, quantity, date, memberId, notes);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // 7. Ajustar Estoque Manualmente (Correção de inventário)
  app.post('/api/houses/:houseId/stock-adjustments', (req, res) => {
    try {
      const { houseId } = req.params;
      const { productId, newStockValue, type, reason, memberId } = req.body;
      const result = db.adjustStock(houseId, productId, newStockValue, type || 'manual_adjustment', reason, memberId);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // 8. Registrar Compra
  app.post('/api/houses/:houseId/purchases', (req, res) => {
    try {
      const { houseId } = req.params;
      const result = db.recordPurchase(houseId, req.body);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // 9. Adicionar Categoria
  app.post('/api/houses/:houseId/categories', (req, res) => {
    try {
      const { houseId } = req.params;
      const { name, icon, color } = req.body;
      const category = db.addCategory(houseId, name, icon, color);
      res.status(201).json(category);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // 10. Adicionar Membro
  app.post('/api/houses/:houseId/members', (req, res) => {
    try {
      const { houseId } = req.params;
      const { name, email, role, avatarColor } = req.body;
      const member = db.addMember(houseId, name, email, role, avatarColor);
      res.status(201).json(member);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // 11. Atualizar Configurações da Casa
  app.put('/api/houses/:houseId/settings', (req, res) => {
    try {
      const { houseId } = req.params;
      const house = db.updateSettings(houseId, req.body);
      res.json(house);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // ==========================================
  // VITE MIDDLEWARE SETUP
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CasaControle Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
