import { t } from 'i18next';
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  Path, Defs, LinearGradient, Stop, Circle, G, Line, Rect, Text as SvgText,
} from 'react-native-svg';

const FONT_SIZES = {
  subtitle: 16,
  yTick: 14,
  callout: 14,
  xLabel: 14,
};

export default function MarketPriceTrendsCard({ priceData, currency = 'USD', COLORS, FONTS }) {
  const history = useMemo(() => {
    const h = Array.isArray(priceData?.reselling_price_history) ? [...priceData.reselling_price_history] : [];
    h.sort((a, b) => (a.month > b.month ? 1 : -1));
    return h.slice(-12);
  }, [priceData]);

  const prices = history.map(h => Number(h.price || 0));
  const labels = history.map(h => h.month?.slice(5) || '');

  // const avgAll = prices.length ? prices.reduce((s, n) => s + n, 0) / prices.length : 0;
  const minAll = prices.length ? Math.min(...prices) : 0;
  const maxAll = prices.length ? Math.max(...prices) : 0;
  
  const minResell = Number(priceData?.min_reselling_price_value ?? minAll);
  const maxResell = Number(priceData?.max_reselling_price_value ?? maxAll);
  const avgAll = (maxResell+minResell)/2;

  const seriesPrice = prices;
  const seriesMax   = prices.map(() => maxResell);
  const seriesAvg   = prices.map((_, i) => {
    const s = prices.slice(0, i + 1).reduce((sum, n) => sum + n, 0);
    return s / (i + 1);
  });

  // ⬇️ more room at bottom for in-SVG x labels
  const WIDTH=700, HEIGHT=360, PAD_L=60, PAD_R=20, PAD_T=30, PAD_B=56;
  const CW=WIDTH-PAD_L-PAD_R, CH=HEIGHT-PAD_T-PAD_B;

  const domainMin = Math.min(minAll, minResell) * 0.95;
  const domainMax = Math.max(maxAll, maxResell) * 1.05;
  const scaleY = (v) => (domainMax === domainMin)
    ? PAD_T + CH / 2
    : PAD_T + CH - ((v - domainMin) / (domainMax - domainMin)) * CH;

  const stepX = seriesPrice.length > 1 ? CW / (seriesPrice.length - 1) : 0;
  const xAt = (i) => PAD_L + i * stepX;

  const toPath = (arr) => (arr.length
    ? arr.map((v,i)=>`${i?'L':'M'} ${xAt(i)} ${scaleY(v)}`).join(' ')
    : ''
  );

  const pathPrice = toPath(seriesPrice);
  const pathMax   = toPath(seriesMax);
  const pathAvg   = toPath(seriesAvg);

  const money = (n) => `${currency} ${Number(n||0).toLocaleString(undefined,{maximumFractionDigits:2})}`;

  const TICKS = 5;
  const yTicks = Array.from({length: TICKS+1}, (_,i) => {
    const v = domainMin + (i*(domainMax-domainMin))/TICKS;
    return { y: scaleY(v), label: Math.round(v).toLocaleString() };
  }).reverse();

  const base = prices[0] || 1;
  const n = seriesPrice.length;
  const annotateIdxs = n >= 5 ? [1, Math.floor(n/2), n-2] : n >= 3 ? [1, n-2] : [];
// console.log({prices: prices,
//   avg : avgAll
// },'pricesss')
  return (
    <View style={styles.container}>
      <Text style={[styles.title,{ color: COLORS.textPrimary, fontFamily: FONTS.semiBold }]}>
        {t('market.priceTrends', 'Market Price Trends')}
      </Text>

      <View style={[styles.chartCard, { borderColor: COLORS.border, backgroundColor: COLORS.cardBackground }]}>
        <Svg width="100%" height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
          <Defs>
            <LinearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={COLORS.primary} stopOpacity="0.20" />
              <Stop offset="1" stopColor={COLORS.primary} stopOpacity="0.00" />
            </LinearGradient>
          </Defs>

          {/* card background */}
          <Rect x="8" y="8" width={WIDTH-16} height={HEIGHT-16} rx="14" ry="14" fill={COLORS.cardBackground} />

          {/* subtitle */}
          <SvgText
            x={PAD_L+4}
            y={PAD_T-8}
            fill={COLORS.textPrimary}
            fontFamily={FONTS.semiBold}
            fontSize={FONT_SIZES.subtitle}
          >
            {t('market.last12Months', 'Last 12 Months')}
          </SvgText>

          {/* axes */}
          <Line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={PAD_T+CH} stroke={COLORS.border} strokeWidth="1.2" />
          <Line x1={PAD_L} y1={PAD_T+CH} x2={WIDTH-PAD_R} y2={PAD_T+CH} stroke={COLORS.border} strokeWidth="1.2" />

          {/* horizontal grid + Y labels */}
          {yTicks.map((tick,i)=>(
            <G key={`yt-${i}`}>
              <Line x1={PAD_L} x2={WIDTH-PAD_R} y1={tick.y} y2={tick.y} stroke={COLORS.border} strokeWidth="1" opacity="0.6" />
              <SvgText
                x={PAD_L-8}
                y={tick.y+5}
                fill={COLORS.textMuted}
                fontFamily={FONTS.light}
                fontSize={FONT_SIZES.yTick}
                textAnchor="end"
              >
                {tick.label}
              </SvgText>
            </G>
          ))}

          {/* x tick marks */}
          {labels.map((_,i)=>(
            <Line key={`xt-${i}`} x1={xAt(i)} x2={xAt(i)} y1={PAD_T+CH} y2={PAD_T+CH+4} stroke={COLORS.border} strokeWidth="1" />
          ))}

          {/* ✅ in-SVG month labels (now right under the axis, near the graph) */}
          {labels.map((mm,i)=>(
            <SvgText
              key={`xl-${i}`}
              x={xAt(i)}
              y={PAD_T+CH+18}
              fill={COLORS.textMuted}
              fontFamily={FONTS.light}
              fontSize={FONT_SIZES.xLabel}
              textAnchor="middle"
            >
              {mm}
            </SvgText>
          ))}

          {/* area under price */}
          {pathPrice ? (
            <Path
              d={`${pathPrice} L ${xAt(seriesPrice.length - 1)} ${scaleY(domainMin)} L ${xAt(0)} ${scaleY(domainMin)} Z`}
              fill="url(#priceFill)"
            />
          ) : null}

          {/* lines */}
          {/* {pathMax ? <Path d={pathMax} stroke={COLORS.secondary} strokeWidth="5" fill="none" strokeLinecap="round" /> : null} */}
          {pathAvg   ? <Path d={pathAvg}   stroke={COLORS.error}   strokeWidth="5" fill="none" strokeLinecap="round" /> : null}
          {pathPrice ? <Path d={pathPrice} stroke={COLORS.primary} strokeWidth="5" fill="none" strokeLinecap="round" /> : null}

          {/* end marker */}
          {seriesPrice.length ? (
            <G>
              <Circle cx={xAt(seriesPrice.length - 1)} cy={scaleY(seriesPrice.at(-1))} r="7" fill={COLORS.primary} />
              <Circle cx={xAt(seriesPrice.length - 1)} cy={scaleY(seriesPrice.at(-1))} r="3.5" fill="#fff" />
            </G>
          ) : null}

          {/* value callouts */}
          {annotateIdxs.map((idx,k)=>{
            const p = prices[idx];
            const pct = ((p - base) / base) * 100;
            return (
              <SvgText
                key={`pct-${k}`}
                x={xAt(idx)}
                y={scaleY(p) - 10}
                fill={COLORS.secondary}
                fontFamily={FONTS.semiBold}
                fontSize={FONT_SIZES.callout}
                textAnchor="middle"
              >
                {pct.toFixed(1)}%
              </SvgText>
            );
          })}
        </Svg>

        {/* legend stays below the chart */}
        <View style={styles.legend}>
          <LegendDot color={COLORS.secondary} label={t('market.maximumPrice', 'Maximum')} FONTS={FONTS} COLORS={COLORS} />
          <LegendDot color={COLORS.error}     label={t('market.averagePrice','Average')}  FONTS={FONTS} COLORS={COLORS} />
          <LegendDot color={COLORS.primary}   label={t('market.price','Minimum')}         FONTS={FONTS} COLORS={COLORS} />
        </View>

        {/* ⛔ removed the old external month row */}
      </View>

      {/* Key Metrics / About unchanged */}
      <View style={[styles.metricsCard, { borderColor: COLORS.border, backgroundColor: COLORS.cardBackground }]}>
        <Text style={[styles.metricsTitle,{ color: COLORS.textPrimary, fontFamily: FONTS.semiBold }]}>{t('market.keyMetrics', 'Key Metrics')}</Text>
        <MetricRow label={t('market.minimum','Minimum')}      value={money(minResell)} COLORS={COLORS} FONTS={FONTS} />
        <MetricRow label={t('market.maximumPrice','Maximum Price')} value={money(maxResell)} COLORS={COLORS} FONTS={FONTS} />
        <MetricRow label={t('market.averagePrice','Average Price')} value={money(avgAll)}    COLORS={COLORS} FONTS={FONTS} />
        <View style={[styles.extraBox,{ borderColor: COLORS.border, backgroundColor: COLORS.cardBackground }]}>
          <Text style={[styles.extraTitle,{ color: COLORS.textPrimary, fontFamily: FONTS.semiBold }]}>{t('market.aboutThisEquipment','About this equipment')}</Text>
          <Text style={[styles.extraText,{ color: COLORS.textSecondary, fontFamily: FONTS.regular }]}>{t('market.co2','CO₂')}:   {priceData?.co2_emissions || '-'}</Text>
          <Text style={[styles.extraText,{ color: COLORS.textSecondary, fontFamily: FONTS.regular }]}>{t('market.weight','Weight')}:   {priceData?.weight || '-'}</Text>
          <Text style={[styles.extraText,{ color: COLORS.textSecondary, fontFamily: FONTS.regular }]}>{t('market.dimension','Dimensions')}:   {priceData?.dimensions || '-'}</Text>
        </View>
      </View>
    </View>
  );
}

function LegendDot({ color, label, FONTS, COLORS }) {
  return (
    <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
      <View style={{ width:10, height:10, borderRadius:5, backgroundColor: color }} />
      <Text style={{ color: COLORS.textSecondary, fontFamily: FONTS.medium }}>{label}</Text>
    </View>
  );
}

function MetricRow({ label, value, COLORS, FONTS }) {
  return (
    <View style={{ flexDirection:'row', justifyContent:'space-between', paddingVertical:8 }}>
      <Text style={{ color: COLORS.textSecondary, fontFamily: FONTS.medium }}>{label}</Text>
      <Text style={{ color: COLORS.primary, fontFamily: FONTS.semiBold }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 12, gap: 12 },
  title: { fontSize: 18, marginBottom: 8 },
  chartCard: { borderRadius: 12, overflow: 'hidden', borderWidth: 1 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 16, paddingVertical: 8 },
  metricsCard: { borderRadius: 12, borderWidth: 1, padding: 16 },
  metricsTitle: { fontSize: 18, marginBottom: 8 },
  extraBox: { marginTop: 12, borderRadius: 10, borderWidth: 1, padding: 12 },
  extraTitle: { fontSize: 14, marginBottom: 6 },
  extraText: { fontSize: 13, lineHeight: 18 },
});
