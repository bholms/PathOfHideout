# Essence Flip

This document explains the math used by the Essence Flip in this Path of Hideout.

## Problem statement
- We have $N$ essence types with known prices $p_i$ (chaos per essence at Defeaning tier).
- You can perform a Harvest swap on one essence, which converts it to a (uniform) random essence type among the $N$ types.
- Each Harvest swap costs $c$ chaos.
- After each swap you can decide to stop (sell the current essence) or continue swapping.
- Goal: for each starting type, compute the optimal policy (stop/continue) that maximizes expected total value.

## Model and optimal policy

Let $V(i)$ be the maximal expected value you can achieve when holding an essence of type $i$.
You have two choices:

1. Stop now and receive $p_i$.
2. Swap once (pay cost $c$) and then follow the optimal policy; the expected value after the swap is the average of $V(j)$ across $j$ (because swaps are uniform), call it $\mathrm{AvgV}$.

Therefore:

$$
V(i) 
=\max\bigl(p_i,\;\mathrm{AvgV} - c\bigr)
$$

Note that 
$\mathrm{AvgV} = \dfrac{1}{N}\sum_{j=1}^N V(j)$.

Because $\mathrm{AvgV}$ is the same for all $i$ (swap distribution doesn't depend on source), define the constant

$$
C \,=\;\mathrm{AvgV} - c
$$

so that

$$
V(i) = \max(p_i,\; C).
$$

Compute $\mathrm{AvgV}$:

$$
\mathrm{AvgV} = \frac{1}{N}\sum_{i=1}^N \max(p_i, C) =: f(C).
$$

But $C = \mathrm{AvgV} - c$, so $C$ must satisfy the fixed-point equation

$$
C = f(C) - c.
$$

Where

$$
f(C) = \frac{1}{N} \sum_{i=1}^N \max(p_i, C).
$$

Solving for $C$

We can solve for $C$ numerically with binary search because $f(C)$ is non-decreasing in $C$, and algorithm is follow:

1. Choose low and high bounds that bracket the solution
2. Compute $\mathrm{mid} = (\mathrm{low}+\mathrm{high})/2$.
3. Evaluate $f(\mathrm{mid}) - c$ and compare to $\mathrm{mid}$. If $f(\mathrm{mid}) - c > \mathrm{mid}$, increase $\mathrm{low} = \mathrm{mid}$, otherwise decrease $\mathrm{high} = \mathrm{mid}$.
4. Repeat until convergence.

Once $C$ is found:

- $V(i) = \max(p_i, C)$
- Optimal policy is determined: stop when $p_i \ge C$, otherwise swap.

## Intuition

- The scalar threshold $C$ has a direct meaning: continue swapping until you have an essence whose price is at least $C$. Because swaps are random and symmetric, this stationary threshold solves the global optimal stopping problem.

## Expected value for a starting type

If you start with type $s$ and $k$ independent essences, the expected final chaos after following the optimal policy is

$$
    \mathbb{E}[\text{final}] = k \cdot V(s).
$$

The expected profit over immediate selling is

$$
    \text{Profit} = k \cdot \bigl(V(s) - p_s\bigr).
$$

## Notes and extensions

- The derivation assumes swaps are uniformly random across all $N$ types and independent of source. Therefore, similar reasoning does not apply to Fossil swapping, for example.
- If swap probabilities depend on source type, the expectation term $\mathrm{AvgV}$ would need to be replaced by the conditional expectation for each source type $i$, i.e. $E[V\mid \text{swap from }i]$. Then one must solve a linear system or perform value iteration.

## References

- Standard optimal stopping / Markov decision process with two actions (stop or continue). The uniform swap distribution simplifies the Bellman equation to a low-dimensional fixed-point problem.