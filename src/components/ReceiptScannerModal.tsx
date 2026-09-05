import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  X, 
  Check, 
  AlertCircle, 
  Trash2, 
  Plus, 
  Store, 
  Calendar,
  DollarSign,
  Loader2,
  RefreshCw,
  SlidersHorizontal,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { Product, PurchaseItem, Category } from '../types';
import { getAIProvider, ParsedReceiptOutput, ParsedReceiptItem } from '../services/ai';
import { formatCurrency } from '../utils/mathEngine';

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  categories: Category[];
  onConfirmPurchase: (purchaseData: {
    storeName: string;
    date: string;
    totalAmount: number;
    items: {
      product_id: string;
      quantity: number;
      unit_price: number;
      total_price: number;
    }[];
  }) => Promise<void>;
  onOpenSettingsForApiKey?: () => void;
}

export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({
  isOpen,
  onClose,
  products,
  categories,
  onConfirmPurchase,
  onOpenSettingsForApiKey,
}) => {
  const [step, setStep] = useState<'upload' | 'scanning' | 'review'>('upload');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isKeyError, setIsKeyError] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Extracted data
  const [storeName, setStoreName] = useState('Supermercado');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [scannedItems, setScannedItems] = useState<(ParsedReceiptItem & { 
    id: string; 
    selectedProductId: string;
    createNewProduct: boolean;
  })[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    if (!file) return;
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    processImageWithGemini(file);
  };

  const processImageWithGemini = async (file: File) => {
    setStep('scanning');
    setErrorMessage(null);
    setIsKeyError(false);

    try {
      const provider = getAIProvider();
      const result: ParsedReceiptOutput = await provider.parseReceipt(file, {
        houseName: 'Minha Casa',
        familyMembersCount: 4,
        productsInStock: products,
        lowStockProducts: products.filter(p => p.current_stock <= p.min_stock_alert),
      });

      setStoreName(result.storeName || 'Supermercado');
      if (result.date && result.date.length === 10) {
        setPurchaseDate(result.date);
      } else {
        setPurchaseDate(new Date().toISOString().slice(0, 10));
      }

      // Map items with matched products
      const mappedItems = (result.items || []).map((item, idx) => {
        // Try fuzzy find product
        const itemLower = item.productName.toLowerCase();
        const matched = products.find(p => {
          const pLower = p.name.toLowerCase();
          return itemLower.includes(pLower) || pLower.includes(itemLower);
        });

        return {
          ...item,
          id: `scanned-${idx}-${Date.now()}`,
          selectedProductId: matched ? matched.id : '',
          createNewProduct: !matched,
        };
      });

      if (mappedItems.length === 0) {
        setErrorMessage('Nenhum item foi identificado com clareza na imagem. Tente tirar uma foto mais nítida com boa iluminação.');
        setStep('upload');
      } else {
        setScannedItems(mappedItems);
        setStep('review');
      }
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('MISSING_KEY')) {
        setIsKeyError(true);
        setErrorMessage('A chave de API gratuita do Gemini ainda não foi cadastrada no aplicativo.');
      } else {
        setErrorMessage(msg || 'Falha ao processar o cupom com o Gemini.');
      }
      setStep('upload');
    }
  };

  const handleItemChange = (id: string, field: string, val: any) => {
    setScannedItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: val };
      if (field === 'quantity' || field === 'unitPrice') {
        const qty = Number(field === 'quantity' ? val : updated.quantity) || 0;
        const price = Number(field === 'unitPrice' ? val : updated.unitPrice) || 0;
        updated.totalPrice = Number((qty * price).toFixed(2));
      }
      return updated;
    }));
  };

  const handleRemoveItem = (id: string) => {
    setScannedItems(prev => prev.filter(item => item.id !== id));
  };

  const handleAddItem = () => {
    setScannedItems(prev => [
      ...prev,
      {
        id: `manual-${Date.now()}`,
        productName: 'Novo Produto',
        quantity: 1,
        unit: 'unidade',
        unitPrice: 0,
        totalPrice: 0,
        selectedProductId: products[0]?.id || '',
        createNewProduct: false,
      }
    ]);
  };

  const calculatedTotal = scannedItems.reduce((acc, item) => acc + (Number(item.totalPrice) || 0), 0);

  const handleConfirm = async () => {
    if (scannedItems.length === 0) {
      setErrorMessage('A lista de itens não pode estar vazia.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Prepare purchase items
      const purchaseItems = scannedItems.map(item => {
        // If product already matches, use that id; otherwise fallback to first or existing
        const pId = item.selectedProductId || products.find(p => p.name.toLowerCase() === item.productName.toLowerCase())?.id || products[0]?.id;
        return {
          product_id: pId,
          quantity: Number(item.quantity) || 1,
          unit_price: Number(item.unitPrice) || 0,
          total_price: Number(item.totalPrice) || 0,
        };
      });

      await onConfirmPurchase({
        storeName: storeName.trim() || 'Supermercado',
        date: purchaseDate,
        totalAmount: Number(calculatedTotal.toFixed(2)),
        items: purchaseItems,
      });

      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao registrar compras e atualizar estoque.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white/90 backdrop-blur-xl border border-white/50 rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-rose-100/50 flex items-center justify-between bg-gradient-to-r from-rose-500/10 via-pink-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-rose-300/60">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-slate-800">
                  Leitura de Cupom Fiscal com IA
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700 uppercase tracking-wider">
                  Gemini Vision
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Tire foto da nota e o Gemini extrai produtos, quantidades e preços automaticamente.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/70 hover:bg-rose-50 text-slate-500 hover:text-rose-600 flex items-center justify-center border border-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Error / Alert Banner */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex flex-col gap-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{errorMessage}</div>
              </div>
              {isKeyError && onOpenSettingsForApiKey && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSettingsForApiKey();
                  }}
                  className="self-start mt-1 px-3.5 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 shadow-sm"
                >
                  ⚙️ Ir para Configurações e Colar Chave
                </button>
              )}
            </div>
          )}

          {/* STEP 1: UPLOAD / CAMERA */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div className="text-center space-y-2 max-w-md mx-auto">
                <p className="text-sm font-semibold text-slate-700">
                  Como você prefere escanear o comprovante de compra?
                </p>
                <p className="text-xs text-slate-500">
                  Certifique-se de que a foto esteja bem iluminada e os itens visíveis.
                </p>
              </div>

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tirar Foto */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="p-6 rounded-3xl bg-gradient-to-b from-rose-50/80 to-white/70 border border-rose-200/80 hover:border-rose-400 flex flex-col items-center justify-center gap-3 transition-all hover:scale-[1.02] shadow-xs active:scale-95 group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-200 group-hover:scale-110 transition-transform">
                    <Camera className="w-7 h-7" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-slate-800 text-base">Tirar Foto Agora</p>
                    <p className="text-xs text-slate-500 mt-0.5">Abre a câmera do celular</p>
                  </div>
                </button>

                {/* Escolher Arquivo / Imagem */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-6 rounded-3xl bg-white/70 border border-white hover:border-rose-300 flex flex-col items-center justify-center gap-3 transition-all hover:scale-[1.02] shadow-xs active:scale-95 group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-slate-800 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-slate-800 text-base">Galeria ou Arquivo</p>
                    <p className="text-xs text-slate-500 mt-0.5">JPG, PNG ou foto salva</p>
                  </div>
                </button>
              </div>

              {/* Hidden Inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />

              {/* Dica de boas práticas */}
              <div className="p-4 rounded-2xl bg-white/50 border border-white/60 text-xs text-slate-500 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 font-bold">
                  💡
                </div>
                <span>
                  O modelo <strong>gemini-2.5-flash</strong> lê cupons fiscais completos, converte pesagens e extrai o total com alta precisão.
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: SCANNING FEEDBACK */}
          {step === 'scanning' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-xl shadow-rose-200 animate-pulse">
                  <Sparkles className="w-10 h-10 animate-spin" style={{ animationDuration: '3s' }} />
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-md">
                  <Loader2 className="w-4 h-4 text-rose-500 animate-spin" />
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-lg font-bold text-slate-800">
                  Lendo itens do cupom com Gemini...
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 max-w-sm">
                  Identificando estabelecimento, data da compra, produtos, unidades de medida e valores.
                </p>
              </div>

              {previewUrl && (
                <div className="w-32 h-40 rounded-2xl overflow-hidden border-2 border-white shadow-md mt-3 relative">
                  <img src={previewUrl} alt="Cupom" className="w-full h-full object-cover opacity-70" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent flex items-end justify-center p-2">
                    <span className="text-[10px] text-white font-bold">Processando</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: REVIEW EXTRACTED ITEMS */}
          {step === 'review' && (
            <div className="space-y-5">
              {/* Cupom Header Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-white/70 border border-white/60">
                <div>
                  <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5 mb-1">
                    <Store className="w-3.5 h-3.5 text-rose-500" />
                    Estabelecimento
                  </label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Ex: Supermercado Guanabara"
                    className="w-full px-3 py-2 rounded-xl bg-white/90 border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-rose-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-rose-500" />
                    Data da Compra
                  </label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/90 border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-rose-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Itens Identificados ({scannedItems.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Item
                  </button>
                </div>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {scannedItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-white/80 border border-white/80 shadow-xs flex flex-col gap-2.5 transition-all hover:bg-white"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={item.productName}
                            onChange={(e) => handleItemChange(item.id, 'productName', e.target.value)}
                            placeholder="Nome do produto"
                            className="w-full px-2.5 py-1 rounded-lg bg-transparent font-bold text-sm text-slate-800 border-b border-transparent focus:border-rose-400 focus:outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition"
                          title="Remover item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Qtd & Unid</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="any"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                              className="w-16 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800"
                            />
                            <span className="text-xs text-slate-500 font-medium">{item.unit}</span>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Preço Unit.</label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value)}
                            className="w-full px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Total</label>
                          <p className="text-xs font-extrabold text-slate-800 pt-1">
                            {formatCurrency(item.totalPrice)}
                          </p>
                        </div>
                      </div>

                      {/* Vincular ao Produto da Casa */}
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-500 uppercase shrink-0">
                          Vincular ao estoque:
                        </span>
                        <select
                          value={item.selectedProductId}
                          onChange={(e) => handleItemChange(item.id, 'selectedProductId', e.target.value)}
                          className="flex-1 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none"
                        >
                          <option value="">Selecione o produto correspondente...</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.current_stock} {p.unit} em estoque)
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 to-pink-500/10 border border-rose-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                    Total do Cupom Extraído
                  </span>
                  <p className="text-xs text-rose-700">
                    {scannedItems.length} itens registrados
                  </p>
                </div>
                <p className="text-xl sm:text-2xl font-extrabold text-rose-950">
                  {formatCurrency(calculatedTotal)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-rose-100/60 bg-white/70 flex items-center justify-between gap-3">
          {step === 'review' ? (
            <>
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="px-4 py-2.5 rounded-2xl bg-white text-slate-600 font-bold text-xs sm:text-sm border border-slate-200 hover:bg-slate-50 transition"
              >
                🔄 Ler Outra Foto
              </button>
              <button
                type="button"
                disabled={isSubmitting || scannedItems.length === 0}
                onClick={handleConfirm}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-200 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Registrando e Atualizando Estoque...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Confirmar e Alimentar Estoque</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-2xl bg-white text-slate-600 font-bold text-xs sm:text-sm border border-slate-200 hover:bg-slate-50 transition"
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
