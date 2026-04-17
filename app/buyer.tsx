import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { supabase } from '../src/lib/supabase';
import { createCheckoutSession, BuyerFilterPayload } from '../src/lib/purchaseFlow';
import { colors, spacing, radius, font } from '../src/theme';

const platformOptions = ['ios', 'android'];
const networkOptions = ['wifi', 'cellular'];
const carrierOptions = ['Verizon', 'AT&T', 'T-Mobile'];

const today = new Date().toISOString().slice(0, 10);

export default function BuyerPreviewScreen() {
  const router = useRouter();
  const { session, initializing } = useAuth();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  const [dateFrom, setDateFrom] = useState('2026-04-01');
  const [dateTo, setDateTo] = useState(today);
  const [platforms, setPlatforms] = useState<string[]>(['ios', 'android']);
  const [networkTypes, setNetworkTypes] = useState<string[]>(['wifi', 'cellular']);
  const [carriers, setCarriers] = useState<string[]>([]);
  const [uptimeMin, setUptimeMin] = useState('70');
  const [uptimeMax, setUptimeMax] = useState('100');
  const [disconnectMin, setDisconnectMin] = useState('0');
  const [disconnectMax, setDisconnectMax] = useState('20');

  useEffect(() => {
    if (!initializing && !session) {
      router.replace('/login');
    }
  }, [initializing, router, session]);

  const filters = useMemo(
    () => ({
      dateFrom,
      dateTo,
      platforms,
      carriers,
      networkTypes,
      uptimeMin: Number(uptimeMin),
      uptimeMax: Number(uptimeMax),
      disconnectMin: Number(disconnectMin),
      disconnectMax: Number(disconnectMax),
      limit: 100,
    }),
    [dateFrom, dateTo, platforms, carriers, networkTypes, uptimeMin, uptimeMax, disconnectMin, disconnectMax],
  );

  const fetchPreview = async () => {
    setLoading(true);
    setError(null);

    const query = supabase
      .from('dataset_connectivity_daily')
      .select('date, platform, carrier, primary_network, disconnect_count, uptime_pct', {
        count: 'exact',
      })
      .eq('sellable', true)
      .order('date', { ascending: false })
      .limit(filters.limit);

    let queryWithFilters = query;
    if (filters.dateFrom) queryWithFilters = queryWithFilters.gte('date', filters.dateFrom);
    if (filters.dateTo) queryWithFilters = queryWithFilters.lte('date', filters.dateTo);
    if (filters.platforms?.length) queryWithFilters = queryWithFilters.in('platform', filters.platforms);
    if (filters.carriers?.length) queryWithFilters = queryWithFilters.in('carrier', filters.carriers);
    if (filters.networkTypes?.length) queryWithFilters = queryWithFilters.in('primary_network', filters.networkTypes);
    if (!Number.isNaN(filters.uptimeMin)) queryWithFilters = queryWithFilters.gte('uptime_pct', filters.uptimeMin);
    if (!Number.isNaN(filters.uptimeMax)) queryWithFilters = queryWithFilters.lte('uptime_pct', filters.uptimeMax);
    if (!Number.isNaN(filters.disconnectMin)) queryWithFilters = queryWithFilters.gte('disconnect_count', filters.disconnectMin);
    if (!Number.isNaN(filters.disconnectMax)) queryWithFilters = queryWithFilters.lte('disconnect_count', filters.disconnectMax);

    const { data, error: queryError, count } = await queryWithFilters;
    if (queryError) {
      setError(queryError.message);
      setRows([]);
      setTotalCount(0);
    } else {
      setRows(data ?? []);
      setTotalCount(count ?? 0);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (session) {
      fetchPreview();
    }
  }, [session, filters]);

  const onPurchasePress = async () => {
    setPurchasing(true);
    setError(null);

    const payload: BuyerFilterPayload = {
      dataset: 'connectivity',
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      platforms: filters.platforms,
      carriers: filters.carriers,
      networkTypes: filters.networkTypes,
      uptimeMin: filters.uptimeMin,
      uptimeMax: filters.uptimeMax,
      disconnectMin: filters.disconnectMin,
      disconnectMax: filters.disconnectMax,
      totalCount,
    };

    try {
      const checkoutUrl = await createCheckoutSession(payload);
      await WebBrowser.openBrowserAsync(checkoutUrl);
    } catch (err: any) {
      setError(err?.message ?? 'Unable to start checkout.');
    } finally {
      setPurchasing(false);
    }
  };

  const toggleValue = (value: string, values: string[], setter: (state: string[]) => void) => {
    const next = values.includes(value)
      ? values.filter((item) => item !== value)
      : [...values, value];
    setter(next);
  };

  if (initializing || !session) return null;

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.container}>
      <Text style={s.logo}>Connectivity Dataset</Text>
      <Text style={s.description}>
        Preview the sellable connectivity dataset before purchase. Filters only query the transformed daily dataset.
      </Text>
      <View style={s.card}>
        <Text style={s.cardTitle}>Filters</Text>
        <View style={s.filterRow}>
          <View style={s.filterGroup}>
            <Text style={s.filterLabel}>Date from</Text>
            <TextInput
              style={s.input}
              value={dateFrom}
              onChangeText={setDateFrom}
              placeholder="YYYY-MM-DD"
            />
          </View>
          <View style={s.filterGroup}>
            <Text style={s.filterLabel}>Date to</Text>
            <TextInput
              style={s.input}
              value={dateTo}
              onChangeText={setDateTo}
              placeholder="YYYY-MM-DD"
            />
          </View>
        </View>

        <Text style={s.filterLabel}>Platforms</Text>
        <View style={s.chipRow}>
          {platformOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                s.chip,
                platforms.includes(option) && s.chipActive,
              ]}
              onPress={() => toggleValue(option, platforms, setPlatforms)}
            >
              <Text style={platforms.includes(option) ? s.chipLabelActive : s.chipLabel}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.filterLabel}>Network</Text>
        <View style={s.chipRow}>
          {networkOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                s.chip,
                networkTypes.includes(option) && s.chipActive,
              ]}
              onPress={() => toggleValue(option, networkTypes, setNetworkTypes)}
            >
              <Text style={networkTypes.includes(option) ? s.chipLabelActive : s.chipLabel}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.filterLabel}>Carriers</Text>
        <View style={s.chipRow}>
          {carrierOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                s.chip,
                carriers.includes(option) && s.chipActive,
              ]}
              onPress={() => toggleValue(option, carriers, setCarriers)}
            >
              <Text style={carriers.includes(option) ? s.chipLabelActive : s.chipLabel}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.filterRow}>
          <View style={s.filterGroup}>
            <Text style={s.filterLabel}>Uptime min</Text>
            <TextInput
              style={s.input}
              value={uptimeMin}
              onChangeText={setUptimeMin}
              keyboardType="numeric"
            />
          </View>
          <View style={s.filterGroup}>
            <Text style={s.filterLabel}>Uptime max</Text>
            <TextInput
              style={s.input}
              value={uptimeMax}
              onChangeText={setUptimeMax}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={s.filterRow}>
          <View style={s.filterGroup}>
            <Text style={s.filterLabel}>Disconnect min</Text>
            <TextInput
              style={s.input}
              value={disconnectMin}
              onChangeText={setDisconnectMin}
              keyboardType="numeric"
            />
          </View>
          <View style={s.filterGroup}>
            <Text style={s.filterLabel}>Disconnect max</Text>
            <TextInput
              style={s.input}
              value={disconnectMax}
              onChangeText={setDisconnectMax}
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>

      <View style={s.card}>
        <View style={s.rowSpace}>
          <View>
            <Text style={s.sectionTitle}>Preview</Text>
            <Text style={s.sectionMeta}>{totalCount} matching rows</Text>
          </View>
          <TouchableOpacity style={s.actionButton} onPress={fetchPreview}>
            <Text style={s.actionButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.md }} />
        ) : error ? (
          <Text style={s.errorText}>{error}</Text>
        ) : rows.length === 0 ? (
          <Text style={s.emptyText}>No preview rows matched the current filters.</Text>
        ) : (
          rows.map((row, index) => (
            <View key={`${row.date}-${index}`} style={s.previewRow}>
              <Text style={s.previewCell}>{row.date}</Text>
              <Text style={s.previewCell}>{row.platform}</Text>
              <Text style={s.previewCell}>{row.carrier}</Text>
              <Text style={s.previewCell}>{row.primary_network}</Text>
              <Text style={s.previewCell}>{row.disconnect_count}</Text>
              <Text style={s.previewCell}>{row.uptime_pct}%</Text>
            </View>
          ))
        )}
      </View>

      <TouchableOpacity
        style={[s.purchaseButton, purchasing && s.buttonDisabled]}
        onPress={onPurchasePress}
        disabled={purchasing}
        activeOpacity={0.7}
      >
        <Text style={s.purchaseText}>
          {purchasing ? 'Starting checkout...' : `Purchase Dataset (${totalCount} rows)`}
        </Text>
      </TouchableOpacity>
      <Text style={s.helpText}>
        Purchase opens Stripe checkout for this dataset slice. The backend server must be configured with a purchase endpoint.
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.xxl, paddingBottom: 48 },
  logo: { color: colors.white, fontSize: font.xl, fontWeight: '800', marginBottom: spacing.md },
  description: { color: colors.textSecondary, fontSize: font.md, marginBottom: spacing.xl },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  cardTitle: { color: colors.textSecondary, fontSize: font.sm, fontWeight: '600', marginBottom: spacing.sm },

  filterRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  filterGroup: { flex: 1 },
  filterLabel: { color: colors.textSecondary, fontSize: font.xs, marginBottom: 4 },
  input: {
    backgroundColor: colors.surface,
    color: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: font.md,
  },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  chip: {
    borderColor: colors.separator,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  chipActive: { backgroundColor: colors.accent },
  chipLabel: { color: colors.textSecondary, fontSize: font.sm },
  chipLabelActive: { color: colors.bg, fontSize: font.sm },

  sectionTitle: { color: colors.white, fontSize: font.lg, fontWeight: '700' },
  sectionMeta: { color: colors.textSecondary, fontSize: font.sm, marginTop: spacing.xs },

  rowSpace: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  actionButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
  },
  actionButtonText: { color: colors.bg, fontSize: font.sm, fontWeight: '700' },

  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  previewCell: { color: colors.white, flex: 1, fontSize: font.sm },
  emptyText: { color: colors.textTertiary, fontSize: font.md, marginTop: spacing.sm },
  errorText: { color: colors.accent, fontSize: font.md, marginTop: spacing.sm },

  purchaseButton: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  buttonDisabled: { opacity: 0.5 },
  purchaseText: { color: colors.white, fontSize: font.md, fontWeight: '700' },
  helpText: { color: colors.textSecondary, fontSize: font.sm, marginTop: spacing.sm },
});
