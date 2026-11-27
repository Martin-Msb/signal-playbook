import { band, CANVAS, defineGuide, isoGrid, note, plot, plotPoint, raise, ride, rule, series, shade, step, stop, table } from "@signal-path/engine";
import type { El, Hue } from "@signal-path/engine";

// One board carries the story: 36 months of sales of one product, in date order.
// Each stop draws one more thing on that series: a random split, the trend and the season,
// the lag that repeats, the folds of a backtest, and the forecast with its interval.
// A second card on the right shows the same idea as a measurement.
const G = isoGrid(480, 180, 30);
const F1 = G.p(7.25, 12.75), F2 = G.p(14.65, 4.15);

/** Monthly units of SOFA-2210: a rise of 1.6 a month, a yearly pattern and a little noise. */
const SEASON = [-12, -18, -8, 0, 6, 2, -6, -10, 2, 10, 28, 42];
const NOISE = [3, -4, 2, -1, 5, -3, 0, 4, -5, 2, -2, 3, -3, 1, 4, -2, -4, 3, 2, -1, 1, -3, 5, -2, 2, -2, -3, 4, 1, -4, 3, 0, -1, 3, -3, 2];
const Y = NOISE.map((n, i) => Math.round(50 + 1.6 * (i + 1) + SEASON[i % 12] + n));
const N = Y.length, sum = (v: number[]) => v.reduce((a, b) => a + b, 0), MEAN = sum(Y) / N;
type P2 = [number, number];

/** The straight line fitted to the series by least squares. */
const SLOPE = sum(Y.map((y, i) => (i + 1 - (N + 1) / 2) * (y - MEAN))) / sum(Y.map((_, i) => (i + 1 - (N + 1) / 2) ** 2));
const trend = (t: number) => MEAN + SLOPE * (t - (N + 1) / 2);
/** Autocorrelation of the series at lag k. */
const acf = (k: number) => sum(Y.slice(k).map((y, i) => (y - MEAN) * (Y[i] - MEAN))) / sum(Y.map((y) => (y - MEAN) ** 2));
/** A forecast from the months up to `origin` only: the same month a year earlier plus the last yearly rise. */
const forecast = (origin: number, h: number) => Y[origin + h - 13] + (sum(Y.slice(origin - 12, origin)) - sum(Y.slice(origin - 24, origin - 12))) / 12;
const ORIGINS = [24, 28, 32], AHEAD = [1, 2, 3, 4];
const FOLD_ERR = ORIGINS.map((o) => sum(AHEAD.map((h) => Math.abs(forecast(o, h) - Y[o + h - 1]))) / AHEAD.length);
const AVG_ERR = sum(FOLD_ERR) / FOLD_ERR.length;
/** The forecast for the year after the history ends, with an interval that widens with the horizon. */
const HORIZON = Array.from({ length: 12 }, (_, i) => i + 1);
const FC = HORIZON.map((h) => forecast(N, h));
const half95 = (h: number) => 1.96 * 5.5 * Math.sqrt(1 + 0.35 * (h - 1)), half80 = (h: number) => (1.28 / 1.96) * half95(h);
const LAST = `${Math.round(FC[5] - half95(6))} to ${Math.round(FC[5] + half95(6))}`;
const bound = (sign: 1 | -1): P2[] => [[N, Y[N - 1]], ...HORIZON.map((h) => [N + h, FC[h - 1] + sign * half95(h)] as P2)];

const SALES = raise(plot("sales", 0, 0, 600, 370, [0, 49.5], [0, 210], { title: "Monthly sales of SOFA-2210", sub: "units", xt: [1, 13, 25, 37, 48], xtl: ["Jan, year 1", "Jan, year 2", "Jan, year 3", "Jan, year 4", "Dec"], yt: [0, 70, 140, 210], always: true }), F1, 30);
const side = (id: string, xr: P2, yr: P2, extra: Parameters<typeof plot>[7]) => raise(plot(id, 0, 0, 300, 290, xr, yr, { group: id, ...extra }), F2, 30);
const YEARS = side("years", [0.5, 15.8], [0, 180], { title: "Each year over the last", sub: "units", xt: [1, 4, 7, 10, 12], xtl: ["Jan", "Apr", "Jul", "Oct", "Dec"], yt: [0, 60, 120, 180] });
const ACF = side("acf", [0, 19], [-0.5, 1], { title: "Autocorrelation by lag", xt: [1, 6, 12, 18], yt: [-0.5, 0, 0.5, 1], xLabel: "lag in months" });
const FOLDS = side("folds", [0.4, 3.6], [0, 8], { title: "Error by fold", sub: `average ${AVG_ERR.toFixed(1)} units`, xt: [1, 2, 3], xtl: ["fold 1", "fold 2", "fold 3"], yt: [0, 4, 8] });
const WIDTH = side("width", [0, 13], [0, 60], { title: "95% interval width", sub: "by months ahead", xt: [1, 3, 6, 9, 12], yt: [0, 20, 40, 60] });

/** Months held out by a random split: later training months sit on both sides of each. */
const TEST = [4, 9, 15, 20, 23, 28, 32];
const LATER = side("later", [0.3, 7.7], [0, 32], { title: "Training months after it", sub: "by test month", xt: [1, 2, 3, 4, 5, 6, 7], xtl: TEST.map(String), yt: [0, 16, 32] });
const SPLIT: Hue[] = Y.map((_, i) => (TEST.includes(i + 1) ? "sand" : "sky"));
/** A hidden marker on a month of the series, so a record can be sent to it. */
const at = (id: string, t: number, y: number): El => stop(id, ...plotPoint(SALES, t, y), undefined, undefined, { group: "anchor" });
const YEAR_HUE = ["muted", "ink", "track"] as const;

export default defineGuide({
  id: "forecasting", track: "ml", module: "Other learning problems", slug: "forecasting",
  title: "Forecasting",
  summary: "Time-ordered data has a trend, a season and a memory of its own past. A forecast uses that structure, is tested by replaying history in order, and is published with its uncertainty.",
  forLeads: "Ask how a forecast was tested and how wide its interval is. A score from a random split and a single number without a range are both warnings. Check the licence of any pretrained weights before production use.",
  status: "draft", minutes: 7,
  counters: ["Tested on", "Structure used", "Backtest folds", "Interval"],
  whatIf: { label: "What if the months were split at random?", step: 0, from: 3 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Sales, forecasts and intervals are illustrative",
    label: "A chart of 36 months of sales of one sofa, rising over three years with a peak every November and December. First a random split scatters test months through the history, and a bar chart counts the training months that come after each one. Then a trend line and shaded peaks mark the structure, and a second chart overlays the three years. An autocorrelation chart shows a spike at a lag of 12 months. A backtest shades the earlier months as training and three later windows as tests, with the forecast origin rolling forward. The forecast for the next year is drawn with an interval that widens. A table lists the licences of pretrained forecasting models.",
    els: [
      SALES,
      series("history", "sales", "line", Y.map((y, i) => [i + 1, y] as P2), { tone: "ink", w: 3, always: true }),
      ...Y.map((y, i) => at(`t${i + 1}`, i + 1, y)),

      // 1. A random split.
      series("split", "sales", "points", Y.map((y, i) => [i + 1, y] as P2), { hues: SPLIT, r: 6, hot: TEST.map((t) => t - 1), group: "random" }),
      series("k-train", "sales", "points", [[5, 196]], { hue: "sky", r: 6, tone: "muted", label: "training month", group: "random" }),
      series("k-test", "sales", "points", [[5, 178]], { hue: "sand", r: 6, tone: "muted", label: "test month", group: "random" }),
      LATER,
      series("later-n", "later", "bars", TEST.map((t, k) => [k + 1, N - t - TEST.filter((u) => u > t).length] as P2), { hue: "sky", group: "later" }),

      // 2. Trend and season.
      ...[0, 1, 2].map((k) => band(`peak${k}`, "sales", 10.5 + 12 * k, 12.5 + 12 * k, { label: k === 0 ? "peak" : undefined, group: "season" })),
      series("trend", "sales", "line", [[1, trend(1)], [N, trend(N)]], { w: 4, group: "trend" }),
      at("tr0", 1, trend(1)), at("tr1", N, trend(N)),
      YEARS,
      ...[0, 1, 2].map((k) => series(`year${k}`, "years", "line", Y.slice(12 * k, 12 * k + 12).map((y, m) => [m + 1, y] as P2), { tone: YEAR_HUE[k], w: k === 2 ? 4 : 3, label: `year ${k + 1}`, group: "years" })),

      // 3. Autocorrelation.
      ACF,
      rule("acf-zero", "acf", 0, { axis: "y", tone: "muted", w: 1.5, group: "acf" }),
      ...Array.from({ length: 18 }, (_, i) => i + 1).map((k) => series(`acf${k}`, "acf", "line", [[k, 0], [k, acf(k)]], { tone: k === 12 ? "track" : "ink", w: k === 12 ? 9 : 7, group: "acf" })),
      series("echo", "sales", "line", [12, 24, 36].map((t) => [t, Y[t - 1]] as P2), { w: 4, group: "echo" }),
      series("echo-p", "sales", "points", [12, 24, 36].map((t) => [t, Y[t - 1]] as P2), { hue: "track", r: 7, group: "echo" }),
      note("echo-n1", ...plotPoint(SALES, 18, 142), "12 months", { strong: true, tone: "track", anchor: "middle", on: "sales", group: "echo" }),
      note("echo-n2", ...plotPoint(SALES, 29.5, 162), "12 months", { strong: true, tone: "track", anchor: "middle", on: "sales", group: "echo" }),
      note("acf-n", ...plotPoint(ACF, 12, acf(12) + 0.12), "lag 12", { strong: true, tone: "track", anchor: "middle", on: "acf", group: "acf" }),

      // 4. The backtest.
      shade("train", "sales", [0.5, 0, 24.5, 210], { tone: "muted", group: "backtest" }),
      note("train-n", ...plotPoint(SALES, 12.5, 190), "training: earlier months only", { strong: true, anchor: "middle", on: "sales", group: "backtest" }),
      ...ORIGINS.flatMap((o, k) => [
        shade(`test${k}`, "sales", [o + 0.5, 0, o + 4.5, 210], { label: `test ${k + 1}`, group: "backtest" }),
        series(`fold${k}`, "sales", "line", AHEAD.map((h) => [o + h, forecast(o, h)] as P2), { w: 4, group: "backtest" }),
      ]),
      FOLDS,
      ...FOLD_ERR.map((e, k) => series(`err${k}`, "folds", "bars", [[k + 1, e]], { hue: "track", label: e.toFixed(1), group: "folds" })),
      rule("avg", "folds", AVG_ERR, { axis: "y", tone: "ink", group: "folds" }),

      // 5. The forecast and its interval.
      series("fc", "sales", "line", [[N, Y[N - 1]], ...HORIZON.map((h) => [N + h, FC[h - 1]] as P2)], { w: 4, group: "forecast" }),
      at("f0", N, Y[N - 1]), at("f6", N + 6, FC[5]),
      series("pi-hi", "sales", "line", bound(1), { w: 2, group: "interval" }), series("pi-lo", "sales", "line", bound(-1), { w: 2, group: "interval" }),
      ...HORIZON.flatMap((h) => [
        shade(`pi95-${h}`, "sales", [N + h - 0.5, FC[h - 1] - half95(h), N + h + 0.5, FC[h - 1] + half95(h)], { group: "interval" }),
        shade(`pi80-${h}`, "sales", [N + h - 0.5, FC[h - 1] - half80(h), N + h + 0.5, FC[h - 1] + half80(h)], { group: "interval" }),
      ]),
      note("pi-n", ...plotPoint(SALES, 43, 44), "80% and 95%", { strong: true, tone: "track", anchor: "middle", on: "sales", group: "interval" }),
      note("pi-n2", ...plotPoint(SALES, 43, 30), "intervals", { strong: true, tone: "track", anchor: "middle", on: "sales", group: "interval" }),
      WIDTH,
      series("w95", "width", "bars", HORIZON.map((h) => [h, 2 * half95(h)] as P2), { hue: "track", group: "width" }),

      // 6. Pretrained models and the licence of their weights.
      raise(table("licence", 0, 0, 300, ["Pretrained model", "Weights licence"], [
        ["Chronos-2", "Apache-2.0"],
        ["TimesFM 2.5", "Apache-2.0"],
        { cells: ["TimesFM 3.0", "non-commercial"], hot: true },
        { cells: ["Moirai 2.0", "CC BY-NC 4.0"], hot: true },
      ], { at: [16, 156], rowH: 48, title: "Foundation models", foot: "licences as read, November 2026", group: "licence" }), F2, 30),
    ],
  },
  steps: [
    step({
      id: "random", label: "Random split", kind: "problem", title: "A random split tests on the past",
      caption: "Operations needs next year's sales of one sofa. A random split scatters the test months through the history, so the model trains on months later than the ones that test it.",
      show: ["random", "later"], counters: ["random months", "none", "0", "none"],
      rides: [ride("history", "t15", "t36", "test month", { then: "trained later", tone: "alert" })],
      body: ["The history is 36 monthly totals in date order. A split that ignores the order holds out seven months at random. Every one of them has training months after it.",
        "Splitters that ignore time are inappropriate for time-ordered data, because they lead to training on future data and evaluating on past data. A real forecast never has the future to learn from."],
      claims: ["forecasting-order"],
    }),
    step({
      id: "structure", label: "Trend, season", kind: "idea", title: "The series has a trend and a season",
      caption: "A trend is a long-term increase or decrease. A seasonal pattern repeats with a fixed and known period. Sales rise year over year and peak every November and December.",
      show: ["trend", "season", "years"], counters: ["random months", "trend, season", "0", "none"],
      rides: [ride("trend", "tr0", "tr1", "trend", { then: `+${Math.round(SLOPE * 12)} a year` })],
      body: ["A trend does not have to be linear. A seasonal pattern comes from seasonal factors such as the time of the year or the day of the week.",
        "Laying the three years over one another shows both at once: the same shape each year, lifted a little higher each time.",
        { callout: { label: "Key idea", text: "Rows of a table can be shuffled. Months cannot: their order carries the structure the forecast depends on." } }],
      claims: ["forecasting-trend", "forecasting-seasonal"],
    }),
    step({
      id: "lags", label: "Autocorrelation", kind: "mechanism", title: "The series correlates with its own past",
      caption: "Autocorrelation measures the linear relationship between lagged values. It is larger at the seasonal lag, here 12 months. Lag features hand those earlier values to boosted trees.",
      show: ["season", "echo", "acf"], counters: ["random months", "trend, season, lag 12", "0", "none"],
      rides: [ride("echo", "t12", "t36", "last December", { via: ["t24"], then: "lag 12" })],
      body: ["When data are seasonal, the autocorrelations are larger at multiples of the seasonal period than at other lags. Each December resembles the December before it.",
        "A lag feature is a column holding the value from an earlier period, such as sales 12 months ago. The scikit-learn example on lagged features fits a histogram gradient boosting regressor on such columns."],
      claims: ["forecasting-autocorrelation", "forecasting-seasonal-lags", "forecasting-lag-features"],
    }),
    step({
      id: "backtest", label: "Backtest", kind: "mechanism", title: "A backtest replays the past in order",
      caption: "Each fold trains only on months before its forecast origin and is tested on the months after it. The origin rolls forward, and accuracy is averaged over the folds.",
      show: ["backtest", "folds"], counters: ["later months", "trend, season, lag 12", "3", "none"],
      rides: [ride("history", "t24", "t32", "origin 1", { via: ["t28"], then: "origin 3" })],
      body: ["The training set consists only of observations that occurred before the test observations, so no future observations are used in constructing the forecast. The procedure is known as evaluation on a rolling forecasting origin, or time series cross-validation.",
        "Unlike standard cross-validation, successive training sets are supersets of those that come before them. scikit-learn provides this split as TimeSeriesSplit."],
      claims: ["forecasting-tscv", "forecasting-supersets"],
    }),
    step({
      id: "interval", label: "Uncertainty", kind: "watch-out", title: "A point forecast hides its uncertainty",
      caption: "A prediction interval gives the range the value is expected to lie in with a specified probability. It usually grows wider as the forecast horizon increases.",
      show: ["forecast", "interval", "width"], counters: ["later months", "trend, season, lag 12", "3", "80% and 95%"],
      rides: [ride("fc", "f0", "f6", "forecast", { then: LAST })],
      body: ["The value of prediction intervals is that they express the uncertainty in the forecasts. Point forecasts can be of almost no value without them.",
        "The further ahead the forecast, the more uncertainty is associated with it. Operations plans stock against the range, not the line."],
      claims: ["forecasting-interval", "forecasting-widen", "forecasting-novalue"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "The model and its licence are choices",
      caption: "",
      show: ["forecast", "interval", "licence"], counters: ["later months", "trend, season, lag 12", "3", "80% and 95%"],
      rides: [ride("fc", "f6", "f6", LAST)],
      body: [{ pair: {
        left: { label: "Fitted on this series", items: ["Exponential smoothing, ARIMA", "Lag features, boosted trees"] },
        right: { label: "Pretrained foundation model", items: ["Chronos-2: Apache-2.0", "TimesFM 3.0 weights: non-commercial"] },
      } },
        "Exponential smoothing and ARIMA are the two most widely used approaches to time series forecasting. Exponential smoothing forecasts are weighted averages of past observations, with weights that decay as observations get older. ARIMA models aim to describe the autocorrelations in the data.",
        "Chronos is a family of pretrained time series forecasting models, and Chronos-2 offers zero-shot forecasting. TimesFM is a pretrained time-series foundation model from Google Research.",
        "Licences differ by model and by version. The TimesFM code and its weights up to version 2.5 are Apache-2.0, while the TimesFM 3.0 weights are restricted to non-commercial, non-production use when downloaded. The Moirai 2.0 weights are CC BY-NC 4.0."],
      claims: ["forecasting-smoothing", "forecasting-arima", "forecasting-chronos", "forecasting-timesfm-licence", "forecasting-moirai-licence"],
    }),
  ],
  governance: { text: "A forecast is published with its prediction interval, because a point forecast can be of almost no value without one. Pretrained weights carry their own licence: the TimesFM 3.0 weights are non-commercial while the code is Apache-2.0.", claims: ["forecasting-novalue", "forecasting-timesfm-licence"] },
  closing: {
    pitfalls: [
      "Scoring a forecasting model on a random split of the months.",
      "Publishing one number per month with no interval around it.",
      "Putting pretrained weights into production after reading only the licence of the code.",
    ],
    questions: [
      "Why must every training month come before the months that test the model?",
      "What does a spike in autocorrelation at lag 12 say about monthly data?",
      "Why does a prediction interval widen as the horizon grows?",
    ],
  },
});
