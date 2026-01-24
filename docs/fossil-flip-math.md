Fossil Flip — Math and assumptions

Overview

This document describes the assumptions and math used by the "Fossil Flip" tool on the main page.

Goal

Same as Essence Flip: compute an optimal stop-threshold C for when to stop flipping (keep) versus continue flipping, given:
- the chaos value for each fossil type (or an alternative unit, e.g. fossils/divine),
- the relative roll weights for each fossil type (non-uniform),
- the lifeforce/divine conversion (to compute craft cost per swap), and
- a fixed lifeforce cost per flip (the tool assumes 30 blue lifeforce per swap, consistent with the essence tool).

Fossil list

The tool provides a representative set of common fossils (sourced from Path of Exile wikis):

- Metallic Fossil
- Frigid Fossil
- Serrated Fossil
- Fundamental Fossil
- Prismatic Fossil
- Pristine Fossil
- Dense Fossil
- Aberrant Fossil
- Aetheric Fossil
- Bound Fossil
- Corroded Fossil
- Bloodstained Fossil
- Hollow Fossil
- Faceted Fossil
- Jagged Fossil
- Gilded Fossil
- Opulent Fossil
- Lucent Fossil
- Fractured Fossil
- Tangled Fossil

(See the PoE wiki for the authoritative and complete list; the site is linked from the main page.)

Weights

Fossils are not equally likely when you spend lifeforce to change a fossil's type — the game uses internally hard-coded weights. These are NOT known here, so the tool accepts relative numeric weights entered by the user. The UI provides example placeholder weights; the tool normalizes any provided set of weights so they form a probability distribution (sum to 1).

For example (placeholders used in the UI):
- `Metallic Fossil` : 12
- `Frigid Fossil` : 10
- `Serrated Fossil`: 8
- `Fundamental Fossil`: 1
- ... (other fossils with example relative weights)

These numbers are treated as relative weights and normalized internally (weight_i := weight_i / sum(weights)).

Pricing units

Prices in the UI can be entered as:
- `chaos / fossil` (price in chaos), or
- `fossils / div` (how many fossils per Divine Orb) — the UI converts this to chaos/fossil using the `chaos per div` field.

Craft cost per flip

Like the Essence tool, the Fossil Flip tool estimates the per-flip craft cost as:

cost_per_flip = 30 * (chaos per blue lifeforce)

If the user provides `blue lifeforce per divine` and `chaos per divine`, the tool derives `chaos per blue lifeforce = (chaos per divine) / (blue lifeforce per divine)`.

Mathematical model

Let types be indexed by i with observable prices p_i (in chaos) and weights w_i (normalized probabilities). A flip replaces the current fossil with a random fossil drawn from that discrete distribution.

We seek a threshold C (in chaos) such that the optimal strategy is:
- Keep/stop on any fossil with p_i >= C
- Flip any fossil with p_i < C

If we denote V_i = max(p_i, C) (the optimal value for an item of type i under the threshold), the recursive fixed-point for C is:

C = f(C) - cost_per_flip,

where f(C) = sum_i w_i * V_i = sum_i w_i * max(p_i, C).

The tool computes C by binary-search / fixed-point iteration over a safe interval [min(p)-cost-10, max(p)+10].

Expected flips

If starting from type s (price p_s), and the stop set S = { i | p_i >= C } with probability q = sum_{i in S} w_i of landing on a stop-type in one swap, then the expected number of swaps (flips) required until reaching a stop-type is:

- 0 if p_s >= C (already stopping),
- otherwise 1/q.

Total expected craft cost for N starting fossils of type s is N * (expected flips per fossil) * cost_per_flip.

Usage notes

- The tool is intentionally conservative about default weights and prices; replace weights with actual in-game weights when known.
- The UI persists fossil inputs separately in `localStorage` under the key `poh_fossil_values`.
- The UI is intended as a decision helper (keep vs flip) and does not simulate multi-stage strategies beyond the fixed-threshold policy.

References

- Path of Exile wiki — Fossil (list of fossils and descriptions)
- PoE official site for currency/market references


If you'd like, I can adjust the default fossil list or supply a larger set of placeholder weights to more closely match an authoritative source you provide later.
