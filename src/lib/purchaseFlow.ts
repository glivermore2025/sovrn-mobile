import Constants from 'expo-constants';

export type BuyerFilterPayload = {
  dataset: 'connectivity';
  dateFrom: string;
  dateTo: string;
  platforms: string[];
  carriers: string[];
  networkTypes: string[];
  uptimeMin: number;
  uptimeMax: number;
  disconnectMin: number;
  disconnectMax: number;
  totalCount: number;
};

const purchaseServerUrl =
  Constants.expoConfig?.extra?.purchaseServerUrl ??
  process.env.EXPO_PUBLIC_PURCHASE_SERVER_URL ??
  '';

export async function createCheckoutSession(filters: BuyerFilterPayload) {
  if (!purchaseServerUrl) {
    throw new Error(
      'Missing purchase server URL. Set EXPO_PUBLIC_PURCHASE_SERVER_URL in app config or environment.',
    );
  }

  const response = await fetch(`${purchaseServerUrl}/create-checkout-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filters),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error || 'Failed to create Stripe checkout session.');
  }

  if (!payload?.url) {
    throw new Error('Stripe checkout session response did not include a URL.');
  }

  return payload.url as string;
}
