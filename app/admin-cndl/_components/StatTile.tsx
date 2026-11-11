import { Stat } from './ui';

export type Kpi = {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  /** Small line under the value (e.g. "৳14,760 today"). */
  sub?: string;
  subTone?: 'neutral' | 'up' | 'down';
  href?: string;
  /** Legacy colour hints from before the minimal redesign — ignored: the
      value stays neutral and colour is reserved for state. Kept so section
      pages compile unchanged until each is redesigned. */
  bg?: string;
  fg?: string;
  valueCls?: string;
};

/** One KPI tile in a section's metric row. */
export function StatTile({ card }: { card: Kpi }) {
  return <Stat label={card.label} value={card.value} sub={card.sub} subTone={card.subTone} icon={card.icon} href={card.href} />;
}
