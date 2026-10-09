export function createAxisDomain(values, scale = 'lin') {
  const finite = values.filter(Number.isFinite);
  const lo = finite.length ? Math.min(...finite) : 0;
  const hi = finite.length ? Math.max(...finite) : 1;
  const positive = finite.filter(v => v > 0);
  const pivot = positive.length ? Math.min(...positive) : 1;
  const logarithmic = scale === 'log';
  const zeroSafe = lo <= 0;
  const transform = logarithmic
    ? zeroSafe ? v => Math.log1p(v / pivot) : v => Math.log(v)
    : v => v;
  const inverse = logarithmic
    ? zeroSafe ? v => Math.expm1(v) * pivot : v => Math.exp(v)
    : v => v;
  const low = transform(lo), high = transform(hi);
  const pad = high > low ? (high - low) * 0.06 : logarithmic ? Math.max(Math.abs(high) * 0.06, 0.1) : Math.abs(high) * 0.06 || 1;
  const min = inverse(lo >= 0 && (!logarithmic || zeroSafe) ? Math.max(0, low - pad) : low - pad);
  const max = inverse(high + pad);
  return {
    min, max,
    project: value => (transform(value) - transform(min)) / (transform(max) - transform(min)),
  };
}
