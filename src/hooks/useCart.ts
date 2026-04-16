import { useState, useEffect, useCallback, useRef } from 'react';
import type { CartItem, Product } from '../types';

const CART_STORAGE_KEY = 'saxar_erp_cart';
const LEGACY_CART_PREFIX = 'sahar_erp_cart';

interface CartState {
  items: CartItem[];
  totalCount: number;
  totalAmount: number;
}

export function useCart(clientId?: string) {
  const storageKey = clientId ? `${CART_STORAGE_KEY}_${clientId}` : CART_STORAGE_KEY;
  const hasHydratedRef = useRef(false);

  const [state, setState] = useState<CartState>({
    items: [],
    totalCount: 0,
    totalAmount: 0,
  });

  const calculateTotals = useCallback((items: CartItem[]) => {
    const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
    setState({ items, totalCount, totalAmount });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setState((prev) => {
      const updatedItems = prev.items.filter((item) => item.productId !== productId);
      const totalCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalAmount = updatedItems.reduce((sum, item) => sum + item.totalPrice, 0);

      return { items: updatedItems, totalCount, totalAmount };
    });
  }, []);

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(productId);
        return;
      }

      setState((prev) => {
        const updatedItems = prev.items.map((item) => {
          if (item.productId === productId) {
            const totalPrice = quantity * item.unitPrice * (1 - item.discountPercent / 100);
            return { ...item, quantity, totalPrice };
          }
          return item;
        });

        const totalCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalAmount = updatedItems.reduce((sum, item) => sum + item.totalPrice, 0);

        return { items: updatedItems, totalCount, totalAmount };
      });
    },
    [removeFromCart]
  );

  const updateDiscount = useCallback((productId: string, discountPercent: number) => {
    setState((prev) => {
      const updatedItems = prev.items.map((item) => {
        if (item.productId === productId) {
          const totalPrice = item.quantity * item.unitPrice * (1 - discountPercent / 100);
          return { ...item, discountPercent, totalPrice };
        }
        return item;
      });

      const totalCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalAmount = updatedItems.reduce((sum, item) => sum + item.totalPrice, 0);

      return { items: updatedItems, totalCount, totalAmount };
    });
  }, []);

  const addToCart = useCallback((product: Product, quantity: number = 1, discountPercent: number = 0) => {
    setState((prev) => {
      const existingItem = prev.items.find((item) => item.productId === product.id);

      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        const totalPrice =
          newQuantity * existingItem.unitPrice * (1 - existingItem.discountPercent / 100);

        const updatedItems = prev.items.map((item) =>
          item.productId === product.id ? { ...item, quantity: newQuantity, totalPrice } : item
        );

        const totalCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalAmount = updatedItems.reduce((sum, item) => sum + item.totalPrice, 0);

        return { items: updatedItems, totalCount, totalAmount };
      }

      const unitPrice = product.b2bPrice || product.basePrice;
      const totalPrice = quantity * unitPrice * (1 - discountPercent / 100);

      const newItem: CartItem = {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        unit: product.unit,
        quantity,
        unitPrice,
        discountPercent,
        totalPrice,
        image: product.images?.[0],
      };

      const updatedItems = [...prev.items, newItem];
      const totalCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalAmount = updatedItems.reduce((sum, item) => sum + item.totalPrice, 0);

      return { items: updatedItems, totalCount, totalAmount };
    });
  }, []);

  // Load cart from localStorage on mount.
  useEffect(() => {
    try {
      try {
        const legacyGuest = localStorage.getItem(LEGACY_CART_PREFIX);
        if (legacyGuest && !localStorage.getItem(CART_STORAGE_KEY)) {
          localStorage.setItem(CART_STORAGE_KEY, legacyGuest);
          localStorage.removeItem(LEGACY_CART_PREFIX);
        }
        if (clientId) {
          const legacyUserKey = `${LEGACY_CART_PREFIX}_${clientId}`;
          const newUserKey = `${CART_STORAGE_KEY}_${clientId}`;
          const legacyUser = localStorage.getItem(legacyUserKey);
          if (legacyUser && !localStorage.getItem(newUserKey)) {
            localStorage.setItem(newUserKey, legacyUser);
            localStorage.removeItem(legacyUserKey);
          }
        }
      } catch {
        /* ignore migration */
      }

      const guestSavedRaw = localStorage.getItem(CART_STORAGE_KEY);
      const userSavedRaw = localStorage.getItem(storageKey);

      const parseItems = (raw: string | null): CartItem[] => {
        if (!raw) return [];
        return JSON.parse(raw) as CartItem[];
      };

      const guestItems = parseItems(guestSavedRaw);
      const userItems = parseItems(userSavedRaw);

      if (clientId && storageKey !== CART_STORAGE_KEY) {
        if (guestItems.length > 0) {
          const mergedByProductId = new Map<string, CartItem>();

          const put = (item: CartItem) => {
            const existing = mergedByProductId.get(item.productId);
            if (!existing) {
              mergedByProductId.set(item.productId, item);
              return;
            }

            const newQuantity = existing.quantity + item.quantity;
            const totalPrice =
              newQuantity * existing.unitPrice * (1 - existing.discountPercent / 100);

            mergedByProductId.set(item.productId, {
              ...existing,
              quantity: newQuantity,
              totalPrice,
            });
          };

          guestItems.forEach(put);
          userItems.forEach(put);

          const mergedItems = Array.from(mergedByProductId.values());
          localStorage.setItem(storageKey, JSON.stringify(mergedItems));
          localStorage.removeItem(CART_STORAGE_KEY);

          calculateTotals(mergedItems);
          return;
        }

        if (userItems.length > 0) {
          calculateTotals(userItems);
        }
        return;
      }

      if (userItems.length > 0) calculateTotals(userItems);
    } catch (error) {
      console.error('Failed to load cart:', error);
    } finally {
      hasHydratedRef.current = true;
    }
  }, [storageKey, clientId, calculateTotals]);

  useEffect(() => {
    if (!hasHydratedRef.current) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(state.items));
    } catch (error) {
      console.error('Failed to save cart:', error);
    }
  }, [state.items, storageKey]);

  const clearCart = useCallback(() => {
    setState({ items: [], totalCount: 0, totalAmount: 0 });
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  const getItem = useCallback(
    (productId: string): CartItem | undefined => {
      return state.items.find((item) => item.productId === productId);
    },
    [state.items]
  );

  const isInCart = useCallback(
    (productId: string): boolean => {
      return state.items.some((item) => item.productId === productId);
    },
    [state.items]
  );

  return {
    ...state,
    addToCart,
    updateQuantity,
    updateDiscount,
    removeFromCart,
    clearCart,
    getItem,
    isInCart,
  };
}
