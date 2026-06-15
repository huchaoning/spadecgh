
template <const double (&data)[801]>
double fx(double x) {
  double pos = x * 800.0;
  int i = int(pos);
  if (i >= 800) return data[800];
  if (i < 0) return data[0];
  double t = pos - double(i);
  return data[i] * (1.0 - t) + data[i + 1] * t;
}