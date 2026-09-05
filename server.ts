// Prevent tsx from leaking an invalid string '.' as __dirname which breaks packages using createRequire(__dirname)
if (typeof globalThis !== 'undefined' && (globalThis as any).__dirname === '.') {
  delete (globalThis as any).__dirname;
}
if (typeof global !== 'undefined' && (global as any).__dirname === '.') {
  delete (global as any).__dirname;
}

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.js';
import { 
  isGeminiConfigured,
  parseReceiptWithGemini,
  chatWithHouseAssistant,
  suggestRecipesFromPantry,
  generateConsumptionInsightsWithGemini,
  getGeminiClient,
  GEMINI_MODEL
} from './server/gemini.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

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
  // MÓDULO DE RECEITAS FAMILIARES (DETERMINÍSTICO)
  // ==========================================
  
  // Listar receitas da casa
  app.get('/api/houses/:houseId/recipes', (req, res) => {
    try {
      const { houseId } = req.params;
      const recipes = db.getRecipes(houseId);
      res.json(recipes);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Criar nova receita
  app.post('/api/houses/:houseId/recipes', (req, res) => {
    try {
      const { houseId } = req.params;
      const recipe = db.addRecipe(houseId, req.body);
      res.status(201).json(recipe);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Atualizar receita existente
  app.put('/api/houses/:houseId/recipes/:recipeId', (req, res) => {
    try {
      const { houseId, recipeId } = req.params;
      const updated = db.updateRecipe(houseId, recipeId, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'Receita não encontrada' });
      }
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Excluir receita
  app.delete('/api/houses/:houseId/recipes/:recipeId', (req, res) => {
    try {
      const { houseId, recipeId } = req.params;
      const deleted = db.deleteRecipe(houseId, recipeId);
      res.json({ success: deleted });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Preparar receita (consumo atômico de ingredientes)
  app.post('/api/houses/:houseId/recipes/:recipeId/prepare', (req, res) => {
    try {
      const { houseId, recipeId } = req.params;
      const { servings, memberId } = req.body;
      const result = db.prepareRecipe(houseId, recipeId, Number(servings) || 1, memberId);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // ==========================================
  // GEMINI AI INTEGRATION (SERVER-SIDE)
  // ==========================================

  // Status da IA e verificação graciosa de chave
  app.get('/api/ai/status', (req, res) => {
    const clientKey = req.headers['x-gemini-api-key'] as string | undefined;
    const isConfigured = isGeminiConfigured(clientKey);
    res.json({
      configured: isConfigured,
      hasServerKey: isGeminiConfigured(),
      hasClientKey: Boolean(clientKey && clientKey.trim().length > 0),
      model: GEMINI_MODEL,
    });
  });

  // Testar conexão com a API do Gemini
  app.post('/api/ai/test-connection', async (req, res) => {
    try {
      const customKey = (req.headers['x-gemini-api-key'] as string) || req.body?.apiKey;
      const client = getGeminiClient(customKey);
      const test = await client.models.generateContent({
        model: GEMINI_MODEL,
        contents: 'Olá! Responda apenas com a palavra OK se a conexão estiver perfeita.',
      });
      res.json({ success: true, message: `Conexão com Google Gemini (${GEMINI_MODEL}) ativa e verificada!`, response: test.text });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Falha ao conectar com o Gemini.' });
    }
  });

  // Chat com o Assistente Familiar
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const customKey = (req.headers['x-gemini-api-key'] as string) || req.body?.apiKey;
      const { messages, context } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Array de mensagens é obrigatório' });
      }
      const reply = await chatWithHouseAssistant(messages, context || { houseName: 'Minha Casa', productsInStock: [], lowStockProducts: [] }, customKey);
      res.json({ reply });
    } catch (err: any) {
      const isKeyError = err.message?.includes('MISSING_API_KEY') || err.message?.includes('API_KEY_INVALID');
      res.status(isKeyError ? 401 : 500).json({ 
        error: err.message || 'Erro ao conversar com o Assistente Gemini.',
        isKeyError
      });
    }
  });

  // Leitura de Cupom Fiscal / Nota Fiscal (OCR multimodal com saída estruturada)
  app.post('/api/ai/parse-receipt', async (req, res) => {
    try {
      const customKey = (req.headers['x-gemini-api-key'] as string) || req.body?.apiKey;
      const { imageBase64, mimeType } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'Imagem em base64 é obrigatória' });
      }
      const parsed = await parseReceiptWithGemini(imageBase64, mimeType || 'image/jpeg', customKey);
      res.json(parsed);
    } catch (err: any) {
      const isKeyError = err.message?.includes('MISSING_API_KEY') || err.message?.includes('API_KEY_INVALID');
      res.status(isKeyError ? 401 : 500).json({ 
        error: err.message || 'Erro ao processar imagem de cupom com Gemini.',
        isKeyError
      });
    }
  });

  // Sugestão de Receitas Inteligentes a partir do Estoque
  app.post('/api/ai/suggest-recipes', async (req, res) => {
    try {
      const customKey = (req.headers['x-gemini-api-key'] as string) || req.body?.apiKey;
      const { currentStock, existingRecipes } = req.body;
      const suggestions = await suggestRecipesFromPantry(currentStock || [], existingRecipes || [], customKey);
      res.json({ suggestions });
    } catch (err: any) {
      const isKeyError = err.message?.includes('MISSING_API_KEY') || err.message?.includes('API_KEY_INVALID');
      res.status(isKeyError ? 401 : 500).json({ 
        error: err.message || 'Erro ao sugerir receitas com Gemini.',
        isKeyError
      });
    }
  });

  // Insights Qualitativos de Consumo e Prevenção de Desperdício
  app.post('/api/ai/consumption-insights', async (req, res) => {
    try {
      const customKey = (req.headers['x-gemini-api-key'] as string) || req.body?.apiKey;
      const { stockData, consumptionHistory, houseName } = req.body;
      const insights = await generateConsumptionInsightsWithGemini(stockData || [], consumptionHistory || [], houseName, customKey);
      res.json(insights);
    } catch (err: any) {
      const isKeyError = err.message?.includes('MISSING_API_KEY') || err.message?.includes('API_KEY_INVALID');
      res.status(isKeyError ? 401 : 500).json({ 
        error: err.message || 'Erro ao gerar insights com Gemini.',
        isKeyError
      });
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
