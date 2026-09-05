/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  FullHouseData, 
  fetchHouseData, 
  getStoredActiveHouseId, 
  apiRecordConsumption, 
  apiRecordPurchase, 
  apiAdjustStock, 
  apiAddProduct, 
  apiUpdateProduct, 
  apiAddCategory, 
  apiAddMember,
  apiResetToDemoData,
  apiResetToEmptyData,
  apiAddRecipe,
  apiUpdateRecipe,
  apiDeleteRecipe,
  apiPrepareRecipe
} from './services/api';
import { Product, UserMember, Recipe } from './types';
import { calculateProductMetrics } from './utils/mathEngine';
import { Navbar } from './components/Navbar';
import { BottomNav, NavTab } from './components/BottomNav';
import { OfflineIndicator } from './components/OfflineIndicator';
import { QuickActionModal } from './components/QuickActionModal';
import { ProductFormModal } from './components/ProductFormModal';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { MemberManagerModal } from './components/MemberManagerModal';
import { RecipeModal } from './components/RecipeModal';
import { RecipeDetailModal } from './components/RecipeDetailModal';

import { DashboardView } from './views/DashboardView';
import { StockView } from './views/StockView';
import { RecipesView } from './views/RecipesView';
import { ShoppingListView } from './views/ShoppingListView';
import { ConsumptionView } from './views/ConsumptionView';
import { PurchasesView } from './views/PurchasesView';
import { SettingsView } from './views/SettingsView';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [data, setData] = useState<FullHouseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [activeMemberId, setActiveMemberId] = useState<string>('');

  // Modals state
  const [quickActionModal, setQuickActionModal] = useState<{
    isOpen: boolean;
    type: 'consumption' | 'purchase' | 'stock_adjustment';
    productId?: string;
  }>({
    isOpen: false,
    type: 'consumption',
  });

  const [productFormModal, setProductFormModal] = useState<{
    isOpen: boolean;
    productToEdit?: Product | null;
  }>({
    isOpen: false,
    productToEdit: null,
  });

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);

  // Recipe Modals state
  const [recipeModal, setRecipeModal] = useState<{
    isOpen: boolean;
    recipeToEdit?: Recipe | null;
  }>({
    isOpen: false,
    recipeToEdit: null,
  });
  const [selectedRecipeDetail, setSelectedRecipeDetail] = useState<Recipe | null>(null);

  const activeHouseId = getStoredActiveHouseId();

  const loadData = async () => {
    try {
      const houseData = await fetchHouseData(activeHouseId);
      setData(houseData);
      if (houseData.members.length > 0 && !activeMemberId) {
        setActiveMemberId(houseData.members[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeHouseId]);

  if (isLoading || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden" style={{ background: 'radial-gradient(at top left, #e0eafc, #cfdef3)' }}>
        <div className="glass-card rounded-[2.5rem] p-8 max-w-sm w-full text-center flex flex-col items-center shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 mb-4 animate-pulse">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">CasaControle</h1>
          <p className="text-xs text-slate-500 mt-1">Carregando despensa e consumo familiar...</p>
        </div>
      </div>
    );
  }

  // Quantidade de itens que precisam ser comprados agora (status 🔴 Comprar)
  const buyNowCount = data.products.filter(p => {
    const metrics = calculateProductMetrics(p, data.consumptions);
    return metrics.recommendation.status === 'buy_now';
  }).length;

  const activeMember = data.members.find(m => m.id === activeMemberId) || data.members[0];

  // Ações
  const handleOpenQuickAction = (type: 'consumption' | 'purchase' | 'stock_adjustment' = 'consumption', productId?: string) => {
    setQuickActionModal({
      isOpen: true,
      type,
      productId,
    });
  };

  const handleRecordConsumption = async (payload: { productId: string; quantity: number; date: string; memberId?: string; notes?: string }) => {
    await apiRecordConsumption(activeHouseId, payload);
    await loadData();
  };

  const handleRecordPurchase = async (payload: any) => {
    await apiRecordPurchase(activeHouseId, payload);
    await loadData();
  };

  const handleAdjustStock = async (payload: any) => {
    await apiAdjustStock(activeHouseId, payload);
    await loadData();
  };

  const handleSaveProduct = async (payload: any) => {
    await apiAddProduct(activeHouseId, payload);
    await loadData();
  };

  const handleUpdateProduct = async (productId: string, payload: any) => {
    await apiUpdateProduct(activeHouseId, productId, payload);
    await loadData();
  };

  const handleAddCategory = async (name: string, icon?: string, color?: string) => {
    await apiAddCategory(activeHouseId, name, icon, color);
    await loadData();
  };

  const handleAddMember = async (memberData: any) => {
    await apiAddMember(activeHouseId, memberData);
    await loadData();
  };

  const handleResetToDemo = async () => {
    const updated = await apiResetToDemoData();
    setData(updated);
    if (updated.members.length > 0) setActiveMemberId(updated.members[0].id);
  };

  const handleResetToEmpty = async () => {
    const updated = await apiResetToEmptyData();
    setData(updated);
    if (updated.members.length > 0) setActiveMemberId(updated.members[0].id);
  };

  // Recipe Handlers
  const handleSaveRecipe = async (recipeData: any) => {
    await apiAddRecipe(activeHouseId, recipeData);
    await loadData();
  };

  const handleUpdateRecipe = async (recipeData: any) => {
    if (!recipeModal.recipeToEdit) return;
    await apiUpdateRecipe(activeHouseId, recipeModal.recipeToEdit.id, recipeData);
    await loadData();
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    await apiDeleteRecipe(activeHouseId, recipeId);
    await loadData();
  };

  const handlePrepareRecipe = async (recipeId: string, servings: number, memberId?: string) => {
    await apiPrepareRecipe(activeHouseId, recipeId, servings, memberId);
    await loadData();
  };

  const handleAddToShoppingList = (productName: string, neededQuantity: number, unit: string, productId?: string) => {
    handleOpenQuickAction('purchase', productId);
  };

  return (
    <div className="min-h-screen text-slate-800 flex flex-col font-sans selection:bg-rose-200 selection:text-rose-950 relative">
      {/* Ambient glowing spots for luminous frosted glass refraction with rose tones */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-rose-300/40 blur-3xl" />
        <div className="absolute top-1/4 -right-32 w-96 h-96 rounded-full bg-pink-200/40 blur-3xl" />
        <div className="absolute bottom-10 left-1/3 w-80 h-80 rounded-full bg-fuchsia-200/30 blur-3xl" />
        <div className="absolute top-2/3 -left-20 w-72 h-72 rounded-full bg-rose-200/35 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <Navbar
          house={data.house}
          members={data.members}
          activeMemberId={activeMemberId}
          purchases={data.purchases}
          onSelectMember={setActiveMemberId}
          onOpenQuickAction={(t) => handleOpenQuickAction(t || 'consumption')}
        />

        {/* Main Content Area */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-5 pb-28">
          {activeTab === 'dashboard' && (
            <DashboardView
              products={data.products}
              consumptions={data.consumptions}
              purchases={data.purchases}
              categories={data.categories}
              members={data.members}
              recipes={data.recipes || []}
              activeMember={activeMember}
              onNavigateTab={setActiveTab}
              onOpenQuickAction={handleOpenQuickAction}
              onOpenNewProduct={() => setProductFormModal({ isOpen: true, productToEdit: null })}
            />
          )}

        {activeTab === 'stock' && (
          <StockView
            products={data.products}
            categories={data.categories}
            consumptions={data.consumptions}
            onOpenNewProduct={() => setProductFormModal({ isOpen: true, productToEdit: null })}
            onEditProduct={(product) => setProductFormModal({ isOpen: true, productToEdit: product })}
            onOpenQuickAction={handleOpenQuickAction}
          />
        )}

        {activeTab === 'recipes' && (
          <RecipesView
            recipes={data.recipes || []}
            products={data.products}
            members={data.members}
            activeMemberId={activeMemberId}
            onSaveRecipe={async (recipeData, recipeId) => {
              if (recipeId) {
                await handleUpdateRecipe(recipeData);
              } else {
                await handleSaveRecipe(recipeData);
              }
            }}
            onDeleteRecipe={handleDeleteRecipe}
            onPrepareRecipe={handlePrepareRecipe}
            onAddToShoppingList={handleAddToShoppingList}
          />
        )}

        {activeTab === 'shopping_list' && (
          <ShoppingListView
            products={data.products}
            consumptions={data.consumptions}
            categories={data.categories}
            onOpenQuickAction={handleOpenQuickAction}
          />
        )}

        {activeTab === 'consumption' && (
          <ConsumptionView
            products={data.products}
            consumptions={data.consumptions}
            members={data.members}
            categories={data.categories}
            onOpenQuickAction={handleOpenQuickAction}
          />
        )}

        {activeTab === 'purchases' && (
          <PurchasesView
            purchases={data.purchases}
            products={data.products}
            categories={data.categories}
            members={data.members}
            priceHistory={data.priceHistory}
            onOpenQuickAction={handleOpenQuickAction}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            house={data.house}
            members={data.members}
            categories={data.categories}
            onOpenAddMember={() => setIsMemberModalOpen(true)}
            onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
            onResetToDemo={handleResetToDemo}
            onResetToEmpty={handleResetToEmpty}
          />
        )}
      </main>

      {/* Bottom Navigation for Mobile Devices */}
      <BottomNav
        currentTab={activeTab}
        onSelectTab={setActiveTab}
        buyNowCount={buyNowCount}
      />

      {/* Offline Status Badge */}
      <OfflineIndicator />

      {/* Modals */}
      <QuickActionModal
        isOpen={quickActionModal.isOpen}
        onClose={() => setQuickActionModal({ isOpen: false, type: 'consumption' })}
        initialType={quickActionModal.type}
        products={data.products}
        members={data.members}
        activeMemberId={activeMemberId}
        preselectedProductId={quickActionModal.productId}
        onRecordConsumption={handleRecordConsumption}
        onRecordPurchase={handleRecordPurchase}
        onAdjustStock={handleAdjustStock}
      />

      <ProductFormModal
        isOpen={productFormModal.isOpen}
        onClose={() => setProductFormModal({ isOpen: false, productToEdit: null })}
        categories={data.categories}
        productToEdit={productFormModal.productToEdit}
        onSaveProduct={handleSaveProduct}
        onUpdateProduct={handleUpdateProduct}
        onOpenAddCategory={() => setIsCategoryModalOpen(true)}
      />

      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={data.categories}
        onAddCategory={handleAddCategory}
      />

      <MemberManagerModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        members={data.members}
        onAddMember={handleAddMember}
      />

      {/* Recipe Modals */}
      <RecipeModal
        isOpen={recipeModal.isOpen}
        recipe={recipeModal.recipeToEdit}
        products={data.products}
        members={data.members}
        activeMemberId={activeMemberId}
        onClose={() => setRecipeModal({ isOpen: false, recipeToEdit: null })}
        onSave={recipeModal.recipeToEdit ? handleUpdateRecipe : handleSaveRecipe}
      />

      <RecipeDetailModal
        isOpen={!!selectedRecipeDetail}
        recipe={selectedRecipeDetail}
        products={data.products}
        members={data.members}
        activeMemberId={activeMemberId}
        onClose={() => setSelectedRecipeDetail(null)}
        onEdit={(recipe) => {
          setSelectedRecipeDetail(null);
          setRecipeModal({ isOpen: true, recipeToEdit: recipe });
        }}
        onDelete={handleDeleteRecipe}
        onPrepare={handlePrepareRecipe}
        onAddToShoppingList={handleAddToShoppingList}
      />
      </div>
    </div>
  );
}
